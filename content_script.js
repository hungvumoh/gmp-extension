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
            min-width: 300px;
            min-height: 200px;
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
            pointer-events: auto;
        `;
        header.innerHTML = `
            <div style="flex-grow: 1; font-weight: bold;">👻 Ghost View (ESC để đóng)</div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <span>🌫️</span>
                <input type="range" id="ghost-opacity" min="0.1" max="1.0" step="0.1" value="0.8" style="width: 80px; cursor: pointer;">
            </div>
            <label style="display: flex; align-items: center; gap: 3px; cursor: pointer; background: rgba(255,255,255,0.2); padding: 2px 5px; border-radius: 3px;">
                <input type="checkbox" id="ghost-clickthru"> 🖱️ Xuyên thấu [Alt+T]
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
            pointer-events: auto;
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

        // Nút kéo giãn (Resize Handle)
        const resizer = document.createElement('div');
        resizer.style.cssText = `
            position: absolute;
            right: 0;
            bottom: 0;
            width: 15px;
            height: 15px;
            cursor: nwse-resize;
            background: linear-gradient(135deg, transparent 50%, #6f42c1 50%);
            z-index: 10;
            pointer-events: auto;
        `;
        ghostContainer.appendChild(resizer);

        document.body.appendChild(ghostContainer);

        // --- LOGIC XỬ LÝ ---

        function toggleClickthru(isTransparent) {
            const checkbox = ghostContainer.querySelector('#ghost-clickthru');
            checkbox.checked = isTransparent;
            if (isTransparent) {
                ghostContainer.style.pointerEvents = 'none';
                ghostContainer.style.background = 'transparent';
                ghostContainer.style.borderStyle = 'dashed';
                ghostContainer.title = 'ĐANG XUYÊN THẤU: Click/Gõ trực tiếp vào web bên dưới. Nhấn Alt+T để tắt.';
                iframeWrapper.style.pointerEvents = 'none';
            } else {
                ghostContainer.style.pointerEvents = 'auto';
                ghostContainer.style.background = 'white';
                ghostContainer.style.borderStyle = 'solid';
                ghostContainer.title = '';
                iframeWrapper.style.pointerEvents = 'auto';
            }
        }

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
            ghostContainer.style.right = 'auto';
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
            toggleClickthru(e.target.checked);
        });

        // 4. Đóng (Close)
        const closeBtn = ghostContainer.querySelector('#ghost-close');
        closeBtn.addEventListener('click', () => {
            ghostContainer.style.display = 'none';
        });

        // 6. Kéo giãn (Resize Logic)
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const startWidth = ghostContainer.offsetWidth;
            const startHeight = ghostContainer.offsetHeight;
            const startX = e.clientX;
            const startY = e.clientY;

            const onMouseMove = (moveEvent) => {
                ghostContainer.style.width = (startWidth + (moveEvent.clientX - startX)) + 'px';
                ghostContainer.style.height = (startHeight + (moveEvent.clientY - startY)) + 'px';
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // 5. Phím ESC và Alt+T
        window.addEventListener('keydown', (e) => {
            if (ghostContainer.style.display === 'none') return;

            if (e.key === 'Escape') {
                ghostContainer.style.display = 'none';
            }
            
            if (e.altKey && (e.key === 't' || e.key === 'T')) {
                e.preventDefault();
                const checkbox = ghostContainer.querySelector('#ghost-clickthru');
                toggleClickthru(!checkbox.checked);
            }
        });
    }
})();
