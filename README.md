# 手勢偵測（Gesture Detection）

Render-ready 的 FastAPI 手勢偵測服務。目前提供瀏覽器攝影機即時手勢控制圖片輪播，並保留 API 健康檢查與圖片輸入端點。

## 本機啟動

```powershell
uv sync
uv run uvicorn main:app --reload
```

開啟 `http://localhost:8000/` 查看攝影機與圖片展示頁面；開啟 `http://localhost:8000/docs` 查看 Swagger API 文件。

開啟 `http://localhost:8000/` 查看瀏覽器預覽頁面。

## Render 設定

- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/health`

## 規劃流程

1. 建立 FastAPI 服務與 Render 健康檢查。
2. 建立左側攝影機、右側圖片展示的操作介面。
3. 使用瀏覽器端 MediaPipe Gesture Recognizer 取得手部 landmark。
4. 實作手掌左移/右移、食指、小指的圖片控制。
5. 支援雙手辨識；手心與手背切換時，圖片同步左右翻轉。
6. 加入上一張、下一張按鈕作為輔助操作。
7. 補上測試、錯誤處理、日誌與 API schema。
8. 在 Render 部署；攝影機需由 HTTPS 或 localhost 安全來源提供。

## 套件安裝清單

- `fastapi`：API 框架
- `uvicorn[standard]`：ASGI 伺服器
- `python-multipart`：接收圖片上傳
- `opencv-python-headless`：Render 無 GUI 環境的影像解碼與處理
- `numpy`：影像矩陣處理
- `mediapipe`：手部 landmark 與手勢偵測基礎

安裝方式：

```powershell
uv sync
# 或
pip install -r requirements.txt
```
