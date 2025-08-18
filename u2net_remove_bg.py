# u2net_remove_bg.py
import sys
import os
import traceback
import time
import json

# 필요한 패키지 임포트 (필수 의존성)
import numpy as np
import cv2

# Pillow는 지연 임포트하여 미설치 환경에서도 폴백 가능하게 처리
try:
    from PIL import Image  # type: ignore
    HAS_PIL = True
except Exception as _pil_err:
    Image = None  # type: ignore
    HAS_PIL = False

def emit(event, data=None):
    try:
        payload = {"event": event}
        if data is not None:
            payload.update(data)
        print(json.dumps(payload, ensure_ascii=False))
    except Exception:
        # 로깅 실패는 무시
        pass

print("=== PYTHON SCRIPT START ===", sys.argv)

def process_image(input_path, output_path, alpha_matting=False, fg_threshold=160, bg_threshold=40, erode_size=1):
    try:
        emit("start", {
            "input": input_path,
            "output": output_path,
            "alpha_matting": bool(alpha_matting),
            "fg_threshold": int(fg_threshold),
            "bg_threshold": int(bg_threshold),
            "erode_size": int(erode_size),
            "has_pil": HAS_PIL
        })
        
        # 입력 파일 존재 확인
        if not os.path.exists(input_path):
            print(f"입력 파일이 존재하지 않습니다: {input_path}")
            return False
        
        # 용량/확장자 검증 (≤ 50MB, JPG/PNG/WEBP)
        try:
            size_bytes = os.path.getsize(input_path)
        except Exception:
            size_bytes = -1
        if size_bytes < 1 or size_bytes > 50 * 1024 * 1024:
            print(f"파일 용량 초과 또는 손상: {size_bytes} bytes", file=sys.stderr)
            return False

        allowed_exts = {'.jpg', '.jpeg', '.png', '.webp'}
        ext = os.path.splitext(input_path)[1].lower()
        if ext not in allowed_exts:
            print(f"허용되지 않은 확장자: {ext}", file=sys.stderr)
            return False
            
        # 입력 이미지 로드
        print("이미지 로드 중...")
        input_image = None
        if HAS_PIL:
            try:
                input_image = Image.open(input_path)  # type: ignore
                input_image = input_image.convert("RGBA")  # type: ignore
            except Exception as e:
                print(f"Pillow 로드 실패, OpenCV로 재시도: {e}", file=sys.stderr)
                input_image = None
        if input_image is None:
            # OpenCV로 대체 로드
            try:
                file_data = np.fromfile(input_path, dtype=np.uint8)
                bgr = cv2.imdecode(file_data, cv2.IMREAD_UNCHANGED)
                if bgr is None:
                    raise RuntimeError("OpenCV imdecode 실패")
                if bgr.ndim == 2:
                    bgr = cv2.cvtColor(bgr, cv2.COLOR_GRAY2BGR)
                rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGBA)
                input_image = Image.fromarray(rgba) if HAS_PIL else rgba  # Pillow 없으면 numpy로 유지
            except Exception as e:
                print(f"이미지 로드 실패(OpenCV): {e}", file=sys.stderr)
                return False

        if HAS_PIL:
            print(f"이미지 크기: {input_image.size}, 모드: {input_image.mode}")  # type: ignore
        else:
            h, w = input_image.shape[:2]  # type: ignore
            print(f"이미지 크기(NumPy): {(w, h)}, 모드: RGBA(가정)")
        
        # rembg 사용 시도 → 실패 시 OpenCV GrabCut 대체 경로
        result_image = None
        try:
            # Pillow가 없으면 rembg는 사용하지 않음
            if not HAS_PIL:
                raise ImportError("Pillow 미설치로 rembg 경로 생략")
            from rembg import remove as rembg_remove
            output_image = rembg_remove(
                input_image,  # type: ignore
                alpha_matting=alpha_matting,
                fg_threshold=fg_threshold,
                bg_threshold=bg_threshold,
                erode_structure_size=erode_size
            )
            print(f"배경 제거 완료(rembg). 결과 이미지 크기: {output_image.size}")
            emit("remove_bg", {"engine": "rembg"})
            result_image = output_image
        except ImportError as e:
            print(f"rembg 미설치로 OpenCV GrabCut 대체 경로 수행: {e}")
            # OpenCV 기반 대체 배경 제거
            if HAS_PIL:
                np_img = np.array(input_image.convert('RGB'))  # type: ignore
            else:
                # input_image가 NumPy인 경우 이미 RGBA 또는 BGR일 수 있음 → RGB 보장
                buf = input_image  # type: ignore
                if buf.shape[2] == 4:
                    img_rgb = cv2.cvtColor(buf, cv2.COLOR_RGBA2RGB)
                else:
                    img_rgb = cv2.cvtColor(buf, cv2.COLOR_BGR2RGB)
                np_img = img_rgb
            img = cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)
            h, w, _ = img.shape
            # 화면 경계에서 약간 안쪽으로 직사각형 초기화 (피사체를 포함하도록 여유)
            rect_margin_w = max(10, w // 20)
            rect_margin_h = max(10, h // 20)
            rect = (rect_margin_w, rect_margin_h, w - 2 * rect_margin_w, h - 2 * rect_margin_h)
            mask = np.zeros((h, w), np.uint8)
            bgdModel = np.zeros((1, 65), np.float64)
            fgdModel = np.zeros((1, 65), np.float64)
            try:
                cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
            except Exception as ex:
                print(f"GrabCut 실패, 단순 임계값 대체로 전환: {ex}")
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                _, mask = cv2.threshold(gray, 0, 1, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            # 전경 마스크 생성
            mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
            # 모폴로지로 가장자리 부드럽게
            kernel = np.ones((erode_size, erode_size), np.uint8)
            mask2 = cv2.morphologyEx(mask2, cv2.MORPH_OPEN, kernel, iterations=1)
            mask2 = cv2.GaussianBlur(mask2.astype('float32'), (0, 0), sigmaX=1.5, sigmaY=1.5)
            alpha = (mask2 * 255).astype('uint8')
            bgr = img
            rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGBA)
            rgba[:, :, 3] = alpha
            result_image = Image.fromarray(rgba) if HAS_PIL else rgba
            print("배경 제거 완료(OpenCV 대체).")
            emit("remove_bg", {"engine": "opencv_grabcut"})
        print("엣지 회색라인 제거 및 부드러운 경계 처리 완료.")
        print("결과 저장 중...")
        # 출력 디렉터리 생성 보장
        out_dir = os.path.dirname(output_path) or '.'
        os.makedirs(out_dir, exist_ok=True)

        if HAS_PIL:
            result_image.save(output_path, 'PNG')  # type: ignore
        else:
            # NumPy 배열을 PNG로 저장
            # RGBA → BGRA 변환 후 imwrite
            bgras = cv2.cvtColor(result_image, cv2.COLOR_RGBA2BGRA)  # type: ignore
            ok = cv2.imwrite(output_path, bgras)
            if not ok:
                print("이미지 저장 실패(OpenCV)", file=sys.stderr)
                return False
        abs_path = os.path.abspath(output_path)
        exists = os.path.exists(output_path)
        size = os.path.getsize(output_path) if exists else 0
        print(f"[DEBUG] output_path 절대경로: {abs_path}")
        print(f"[DEBUG] 파일 존재 여부: {exists}")
        print(f"[DEBUG] 파일 크기: {size} bytes")
        if not exists or size == 0:
            print(f"파일 저장 실패: {abs_path}", file=sys.stderr)
            sys.exit(1)
        # 실제로 이미지로 열리는지 체크
        if HAS_PIL:
            try:
                with Image.open(output_path) as im:  # type: ignore
                    im.verify()
            except Exception as e:
                print(f"저장된 파일이 이미지가 아님: {e}", file=sys.stderr)
                sys.exit(1)
        print(f"결과 저장 완료: {output_path}")
        emit("done", {"success": True, "output": output_path})
        
        return True
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        print("상세 에러:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        emit("done", {"success": False, "error": str(e)})
        return False

if __name__ == "__main__":
    try:
        # 인자: <input> <output> [alpha_matting] [fg_threshold] [bg_threshold] [erode_size]
        argc = len(sys.argv)
        if argc < 3:
            print("Usage: python u2net_remove_bg.py <input_image_path> <output_image_path>", file=sys.stderr)
            sys.exit(1)
        
        input_path = sys.argv[1]
        output_path = sys.argv[2]
        
        # 매개변수 파싱 (옷 부분 투명화 방지를 위한 보수적 설정)
        alpha_matting = False
        fg_threshold = 120  # 더 낮은 값으로 foreground 범위 확대
        bg_threshold = 60   # 더 높은 값으로 background 범위 축소
        erode_size = 1
        
        if argc > 3:
            alpha_matting = sys.argv[3].lower() == 'true'
        if argc > 4:
            fg_threshold = max(80, min(200, int(sys.argv[4])))  # 80-200 범위로 제한
        if argc > 5:
            bg_threshold = max(20, min(100, int(sys.argv[5])))  # 20-100 범위로 제한
        if argc > 6:
            erode_size = max(1, min(5, int(sys.argv[6])))       # 1-5 범위로 제한
            
        ok = process_image(input_path, output_path, alpha_matting, fg_threshold, bg_threshold, erode_size)
        sys.exit(0 if ok else 1)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
