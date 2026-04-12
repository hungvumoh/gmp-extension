// File: content_script.js
// Logic cho Floating Ghost Viewer trên website public portal

(function() {
    let ghostContainer = null;

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SHOW_GHOST_VIEW') {
            createOrUpdateGhostView(message.url);
        }
    });

    function createOrUpdateGhostView(url) {
        if (ghostContainer) {
            const iframe = ghostContainer.querySelector('iframe');
            if (iframe) iframe.src = url;
            ghostContainer.style.display = 'flex';
            return;
        }

        // Tạo container chính
        ghostContainer = document.createElement('div');
        ghostContainer.id = 'gmp-ghost-container';
        ghostContainer.style.cssText = `
            position: fixed;
            top: 50px;
            right: 50px;
            width: 600px;
            height: 800px;
            background: white;
            border: 2px solid #6f42c1;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 2147483647;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            opacity: 0.8;
            transition: opacity 0.2s;
        `;

        // Thanh tiêu đề (để kéo)
        const header = document.createElement('div');
        header.style.cssText = `
            background: #6f42c1;
            color: white;
            padding: 8px 12px;
            cursor: move;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: sans-serif;
            font-size: 13px;
            user-select: none;
        `;
        header.innerHTML = `
            <div style="flex-grow: 1; font-weight: bold;">👻 Ghost View (ESC để đóng)</div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <span>🌫️</span>
                <input type="range" id="ghost-opacity" min="0.1" max="1.0" step="0.1" value="0.8" style="width: 80px; cursor: pointer;">
            </div>
            <label style="display: flex; align-items: center; gap: 3px; cursor: pointer; background: rgba(255,255,255,0.2); padding: 2px 5px; border-radius: 3px;">
                <input type="checkbox" id="ghost-clickthru"> 🖱️ Xuyên thấu
            </label>
            <button id="ghost-close" style="background: #dc3545; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-weight: bold;">X</button>
        `;

        // Iframe chứa PDF
        const iframeWrapper = document.createElement('div');
        iframeWrapper.id = 'gmp-iframe-wrapper';
        iframeWrapper.style.cssText = `
            flex-grow: 1;
            position: relative;
            background: #525659;
        `;

        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
        `;

        iframeWrapper.appendChild(iframe);
        ghostContainer.appendChild(header);
        ghostContainer.appendChild(iframeWrapper);
        document.body.appendChild(ghostContainer);

        // --- LOGIC XỬ LÝ ---

        // 1. Kéo thả (Draggable)
        let isDragging = false;
        let offsetX, offsetY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
            isDragging = true;
            offsetX = e.clientX - ghostContainer.offsetLeft;
            offsetY = e.clientY - ghostContainer.offsetTop;
            header.style.background = '#5a32a3';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            ghostContainer.style.left = (e.clientX - offsetX) + 'px';
            ghostContainer.style.top = (e.clientY - offsetY) + 'px';
            ghostContainer.style.right = 'auto'; // Hủy bỏ right cố định
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            header.style.background = '#6f42c1';
        });

        // 2. Độ trong suốt (Opacity)
        const opacityInput = ghostContainer.querySelector('#ghost-opacity');
        opacityInput.addEventListener('input', (e) => {
            ghostContainer.style.opacity = e.target.value;
        });

        // 3. Xuyên thấu (Click-through)
        const clickthruCheckbox = ghostContainer.querySelector('#ghost-clickthru');
        clickthruCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                iframeWrapper.style.pointerEvents = 'none';
                ghostContainer.style.borderStyle = 'dashed';
                ghostContainer.title = 'Chế độ xuyên thấu: Không thể cuộn PDF, hãy bỏ tích để cuộn';
            } else {
                iframeWrapper.style.pointerEvents = 'auto';
                ghostContainer.style.borderStyle = 'solid';
                ghostContainer.title = '';
            }
        });

        // 4. Đóng (Close)
        const closeBtn = ghostContainer.querySelector('#ghost-close');
        closeBtn.addEventListener('click', () => {
            ghostContainer.style.display = 'none';
        });

        // 5. Phím ESC
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && ghostContainer.style.display !== 'none') {
                ghostContainer.style.display = 'none';
            }
        });
    }
})();
