"""
국보 AI 이미지 생성 관리 시스템
- Firestore 데이터 조회/수정
- Cloud Storage 이미지 저장 (8가지 Case별)
- 프롬프트 확인 및 이미지 생성
"""

import os
from flask import Flask, render_template, request, jsonify, redirect, url_for
from google.cloud import firestore
from google.cloud import storage
from google.oauth2 import service_account
from datetime import datetime
import json
import base64

app = Flask(__name__)

# 설정
PROJECT_ID = os.environ.get('PROJECT_ID', 'feels-edutech-476903')
FIRESTORE_DATABASE = os.environ.get('FIRESTORE_DATABASE', 'feels-edutech')
STORAGE_BUCKET = os.environ.get('STORAGE_BUCKET', 'feels-edutech-476903-treasures')

# 4가지 Case 정의 (Gemini API는 네거티브 프롬프트 미지원)
CASES = {
    0: {'prompt': '단순', 'reference': False, 'desc': '단순 프롬프트'},
    1: {'prompt': '단순', 'reference': True, 'desc': '단순 + 참조'},
    2: {'prompt': '상세', 'reference': False, 'desc': '상세 프롬프트'},
    3: {'prompt': '상세', 'reference': True, 'desc': '상세 + 참조'},
}

# 이미지 상태 옵션
IMAGE_STATUS_OPTIONS = [
    {'value': 'success', 'label': '성공', 'color': 'success'},
    {'value': 'generation_failed', 'label': '생성실패', 'color': 'danger'},
    {'value': 'historical_error', 'label': '역사고증오류', 'color': 'warning'},
    {'value': 'style_mismatch', 'label': '스타일불일치', 'color': 'info'},
    {'value': 'low_quality', 'label': '품질미달', 'color': 'secondary'},
    {'value': 'pending_review', 'label': '검토대기', 'color': 'dark'},
]

# 역사고증오류 유형
HISTORICAL_ERROR_TYPES = [
    {'value': 'costume', 'label': '의상/복식 오류', 'desc': '시대에 맞지 않는 의복, 갑옷, 장신구 등'},
    {'value': 'architecture', 'label': '건축 양식 오류', 'desc': '시대에 맞지 않는 건물 형태, 지붕, 기와 등'},
    {'value': 'object', 'label': '도구/물건 오류', 'desc': '시대에 없던 물건, 도구, 무기 등'},
    {'value': 'person', 'label': '인물 외형 오류', 'desc': '헤어스타일, 수염, 화장 등 시대착오'},
    {'value': 'environment', 'label': '환경/배경 오류', 'desc': '시대에 맞지 않는 풍경, 식물, 동물 등'},
    {'value': 'cultural', 'label': '문화/풍속 오류', 'desc': '시대에 맞지 않는 풍습, 의례 등'},
    {'value': 'text', 'label': '문자/글씨 오류', 'desc': '한글/한자 사용 시기 오류, 서체 오류 등'},
    {'value': 'other', 'label': '기타', 'desc': '위에 해당하지 않는 기타 고증 오류'},
]


def get_firestore_client():
    """Firestore 클라이언트"""
    return firestore.Client(project=PROJECT_ID, database=FIRESTORE_DATABASE)


def get_storage_client():
    """Cloud Storage 클라이언트"""
    return storage.Client(project=PROJECT_ID)


@app.route('/')
def index():
    """메인 페이지 - 국보 목록"""
    db = get_firestore_client()

    # 필터링 파라미터
    era = request.args.get('era', '')
    treasure_type = request.args.get('type', '')
    search = request.args.get('search', '')
    page = int(request.args.get('page', 1))
    per_page = 20

    # 쿼리
    query = db.collection('treasures')

    # 전체 데이터 가져오기
    docs = list(query.stream())

    # 필터링
    treasures = []
    for doc in docs:
        data = doc.to_dict()
        data['doc_id'] = doc.id

        # 필터 적용
        if era and data.get('era') != era:
            continue
        if treasure_type and data.get('type') != treasure_type:
            continue
        if search and search.lower() not in data.get('treasure_name', '').lower():
            continue

        treasures.append(data)

    # treasure_id로 정렬
    treasures.sort(key=lambda x: x.get('treasure_id', 0))

    # 페이지네이션
    total = len(treasures)
    start = (page - 1) * per_page
    end = start + per_page
    treasures = treasures[start:end]

    # 시대/유형 목록 (필터용)
    all_docs = list(db.collection('treasures').stream())
    eras = sorted(set(d.to_dict().get('era', '') for d in all_docs if d.to_dict().get('era')))
    types = sorted(set(d.to_dict().get('type', '') for d in all_docs if d.to_dict().get('type')))

    return render_template('index.html',
                         treasures=treasures,
                         eras=eras,
                         types=types,
                         current_era=era,
                         current_type=treasure_type,
                         search=search,
                         page=page,
                         total=total,
                         per_page=per_page,
                         cases=CASES)


@app.route('/treasure/<doc_id>')
def treasure_detail(doc_id):
    """국보 상세 페이지"""
    db = get_firestore_client()
    doc = db.collection('treasures').document(doc_id).get()

    if not doc.exists:
        return "국보를 찾을 수 없습니다", 404

    treasure = doc.to_dict()
    treasure['doc_id'] = doc_id

    # 네거티브 프롬프트 추출 (combined_prompt에서 [Negative] 이후)
    prompts = treasure.get('prompts', {})
    if prompts and not prompts.get('negative_prompt'):
        combined = prompts.get('combined_prompt', '')
        if '[Negative]' in combined:
            prompts['negative_prompt'] = combined.split('[Negative]')[1].strip()
            treasure['prompts'] = prompts

    # 저장된 이미지 목록 조회
    try:
        storage_client = get_storage_client()
        bucket = storage_client.bucket(STORAGE_BUCKET)
        prefix = f"treasures/{treasure.get('treasure_id', 0):04d}/"
        blobs = list(bucket.list_blobs(prefix=prefix))

        images = []
        for blob in blobs:
            # 경로에서 Case 정보 추출
            parts = blob.name.split('/')
            if len(parts) >= 3:
                case_folder = parts[2]  # case_1, case_2, etc.
                case_num = int(case_folder.split('_')[1]) if '_' in case_folder else 0
                images.append({
                    'name': blob.name,
                    'case': case_num,
                    'url': blob.public_url,
                    'created': blob.time_created
                })

        # Case별로 그룹화 (Case 0, 1, 2, 3)
        images_by_case = {i: [] for i in range(0, 4)}
        for img in images:
            if img['case'] in images_by_case:
                images_by_case[img['case']].append(img)
    except Exception as e:
        images_by_case = {i: [] for i in range(0, 4)}

    return render_template('detail.html',
                         treasure=treasure,
                         cases=CASES,
                         images_by_case=images_by_case,
                         image_status_options=IMAGE_STATUS_OPTIONS,
                         historical_error_types=HISTORICAL_ERROR_TYPES)


@app.route('/treasure/<doc_id>/edit', methods=['GET', 'POST'])
def treasure_edit(doc_id):
    """국보 수정"""
    db = get_firestore_client()
    doc_ref = db.collection('treasures').document(doc_id)
    doc = doc_ref.get()

    if not doc.exists:
        return "국보를 찾을 수 없습니다", 404

    if request.method == 'POST':
        # 업데이트 데이터
        update_data = {
            'prompts.detailed_prompt': request.form.get('detailed_prompt', ''),
            'video_prompts.main_prompt': request.form.get('video_prompt', ''),
            'updated_at': firestore.SERVER_TIMESTAMP,
        }

        doc_ref.update(update_data)
        return redirect(url_for('treasure_detail', doc_id=doc_id))

    treasure = doc.to_dict()
    treasure['doc_id'] = doc_id
    return render_template('edit.html', treasure=treasure)


@app.route('/api/treasure/<doc_id>')
def api_treasure(doc_id):
    """API: 국보 데이터 조회"""
    db = get_firestore_client()
    doc = db.collection('treasures').document(doc_id).get()

    if not doc.exists:
        return jsonify({'error': 'Not found'}), 404

    data = doc.to_dict()
    # Timestamp 변환
    for key in ['created_at', 'updated_at']:
        if key in data and data[key]:
            data[key] = data[key].isoformat() if hasattr(data[key], 'isoformat') else str(data[key])

    return jsonify(data)


@app.route('/api/treasure/<doc_id>/upload', methods=['POST'])
def api_upload_image(doc_id):
    """API: 이미지 업로드"""
    db = get_firestore_client()
    doc = db.collection('treasures').document(doc_id).get()

    if not doc.exists:
        return jsonify({'error': 'Not found'}), 404

    treasure = doc.to_dict()
    treasure_id = treasure.get('treasure_id', 0)

    # 요청 데이터
    case_num = int(request.form.get('case', 1))
    trial_num = int(request.form.get('trial', 1))
    media_type = request.form.get('media_type', 'image')  # image or video

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # 파일 확장자
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'png'

    # Cloud Storage 경로
    # 구조: treasures/{treasure_id}/case_{case}/trial_{trial}/{media_type}.{ext}
    blob_path = f"treasures/{treasure_id:04d}/case_{case_num}/trial_{trial_num}/{media_type}.{ext}"

    # 사용된 프롬프트 정보
    case_info = CASES.get(case_num, {})
    prompts_used = {
        'case': case_num,
        'case_desc': case_info.get('desc', ''),
        'reference_used': case_info.get('reference', False),
        'prompt_text': treasure.get('prompts', {}).get('detailed_prompt', ''),
    }

    try:
        storage_client = get_storage_client()
        bucket = storage_client.bucket(STORAGE_BUCKET)
        blob = bucket.blob(blob_path)

        # 메타데이터 설정
        blob.metadata = {
            'treasure_id': str(treasure_id),
            'treasure_name': treasure.get('treasure_name', ''),
            'case': str(case_num),
            'trial': str(trial_num),
            'prompts_used': json.dumps(prompts_used, ensure_ascii=False),
            'uploaded_at': datetime.now().isoformat(),
        }

        blob.upload_from_file(file)

        # uniform bucket-level access 사용 시 공개 URL 직접 구성
        public_url = f"https://storage.googleapis.com/{STORAGE_BUCKET}/{blob_path}"

        # Firestore에 이미지 정보 저장
        doc_ref = db.collection('treasures').document(doc_id)
        images_key = f'images.case_{case_num}.trial_{trial_num}'
        doc_ref.update({
            images_key: {
                'url': public_url,
                'path': blob_path,
                'prompts_used': prompts_used,
                'uploaded_at': firestore.SERVER_TIMESTAMP,
            }
        })

        return jsonify({
            'success': True,
            'url': public_url,
            'path': blob_path,
            'prompts_used': prompts_used
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/prompts/<doc_id>/<int:case_num>')
def api_get_prompts(doc_id, case_num):
    """API: 특정 Case에 사용될 프롬프트 조회"""
    db = get_firestore_client()
    doc = db.collection('treasures').document(doc_id).get()

    if not doc.exists:
        return jsonify({'error': 'Not found'}), 404

    treasure = doc.to_dict()
    case_info = CASES.get(case_num, {})

    # Case에 따라 다른 프롬프트 사용
    if case_num in [0, 1]:
        # 단순 프롬프트: 비어있으면 자동 생성
        prompt = treasure.get('prompts', {}).get('base_prompt', '')
        if not prompt:
            treasure_name = treasure.get('treasure_name', '')
            era = treasure.get('era', '')
            prompt = f"{treasure_name}의 {era} 시대배경에 맞는 역사 이미지를 생성해주세요."
        prompt_type = '단순 프롬프트'
    else:
        prompt = treasure.get('prompts', {}).get('detailed_prompt', '')
        prompt_type = '상세 프롬프트'

    # 네거티브 프롬프트 (combined_prompt에서 [Negative] 이후 추출)
    negative_prompt = treasure.get('prompts', {}).get('negative_prompt', '')
    if not negative_prompt:
        combined = treasure.get('prompts', {}).get('combined_prompt', '')
        if '[Negative]' in combined:
            negative_prompt = combined.split('[Negative]')[1].strip()

    result = {
        'case': case_num,
        'case_info': case_info,
        'treasure_name': treasure.get('treasure_name', ''),
        'era': treasure.get('era', ''),
        'prompt': prompt,
        'prompt_type': prompt_type,
        'negative_prompt': negative_prompt,
        'reference_required': case_info.get('reference', False),
        'video_prompt': treasure.get('video_prompts', {}).get('main_prompt', ''),
    }

    return jsonify(result)


@app.route('/api/treasure/<doc_id>/reference', methods=['POST'])
def api_upload_reference(doc_id):
    """API: 참조 이미지 업로드"""
    db = get_firestore_client()
    doc = db.collection('treasures').document(doc_id).get()

    if not doc.exists:
        return jsonify({'error': 'Not found'}), 404

    treasure = doc.to_dict()
    treasure_id = treasure.get('treasure_id', 0)

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # 파일 확장자
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'png'

    # Cloud Storage 경로 - 참조 이미지는 별도 폴더
    blob_path = f"treasures/{treasure_id:04d}/reference/original.{ext}"

    try:
        storage_client = get_storage_client()
        bucket = storage_client.bucket(STORAGE_BUCKET)
        blob = bucket.blob(blob_path)

        # 메타데이터 설정
        blob.metadata = {
            'treasure_id': str(treasure_id),
            'treasure_name': treasure.get('treasure_name', ''),
            'type': 'reference_image',
            'uploaded_at': datetime.now().isoformat(),
        }

        blob.upload_from_file(file)

        # uniform bucket-level access 사용 시 공개 URL 직접 구성
        public_url = f"https://storage.googleapis.com/{STORAGE_BUCKET}/{blob_path}"

        # Firestore에 참조 이미지 정보 저장
        doc_ref = db.collection('treasures').document(doc_id)
        doc_ref.update({
            'reference_image': {
                'url': public_url,
                'path': blob_path,
                'uploaded_at': firestore.SERVER_TIMESTAMP,
            }
        })

        return jsonify({
            'success': True,
            'url': public_url,
            'path': blob_path
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/treasure/<doc_id>/image-status', methods=['POST'])
def api_update_image_status(doc_id):
    """API: 이미지 상태 업데이트 (성공, 생성실패, 역사고증오류 등)"""
    db = get_firestore_client()
    doc = db.collection('treasures').document(doc_id).get()

    if not doc.exists:
        return jsonify({'error': 'Not found'}), 404

    # 요청 데이터
    data = request.get_json()
    case_num = data.get('case')
    trial_num = data.get('trial')
    status = data.get('status')  # success, generation_failed, historical_error, etc.
    note = data.get('note', '')  # 추가 메모
    error_types = data.get('error_types', [])  # 역사고증오류 유형 (복수 선택 가능)

    if case_num is None or trial_num is None or not status:
        return jsonify({'error': 'Missing required fields: case, trial, status'}), 400

    # 유효한 상태인지 확인
    valid_statuses = [opt['value'] for opt in IMAGE_STATUS_OPTIONS]
    if status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Valid options: {valid_statuses}'}), 400

    try:
        doc_ref = db.collection('treasures').document(doc_id)
        images_key = f'images.case_{case_num}.trial_{trial_num}.evaluation'

        evaluation_data = {
            'status': status,
            'note': note,
            'evaluated_at': firestore.SERVER_TIMESTAMP,
        }

        # 역사고증오류인 경우 오류 유형도 저장
        if status == 'historical_error' and error_types:
            evaluation_data['error_types'] = error_types

        doc_ref.update({
            images_key: evaluation_data
        })

        return jsonify({
            'success': True,
            'case': case_num,
            'trial': trial_num,
            'status': status,
            'note': note
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/stats')
def stats():
    """통계 페이지"""
    db = get_firestore_client()
    docs = list(db.collection('treasures').stream())

    stats = {
        'total': len(docs),
        'by_era': {},
        'by_type': {},
        'with_images': 0,
        'with_video_prompts': 0,
        'images_by_case': {i: 0 for i in range(0, 4)},
    }

    for doc in docs:
        data = doc.to_dict()

        # 시대별
        era = data.get('era', '미분류')
        stats['by_era'][era] = stats['by_era'].get(era, 0) + 1

        # 유형별
        t = data.get('type', '미분류')
        stats['by_type'][t] = stats['by_type'].get(t, 0) + 1

        # 이미지 있는 항목
        if data.get('images'):
            stats['with_images'] += 1
            for case_key in data['images']:
                case_num = int(case_key.split('_')[1]) if '_' in case_key else 0
                if case_num in stats['images_by_case']:
                    stats['images_by_case'][case_num] += 1

        # 영상 프롬프트 있는 항목
        if data.get('video_prompts', {}).get('main_prompt'):
            stats['with_video_prompts'] += 1

    return render_template('stats.html', stats=stats, cases=CASES)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
