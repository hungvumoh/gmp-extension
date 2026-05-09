// ===================================================================
// CẤU HÌNH - ĐIỀN 2 URL NÀY
// ===================================================================
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1lOo4wFZ846sI0Z2PvMzx8ta4ylkzGK7lbFqjM-iWJLc/edit?gid=0#gid=0';
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbznyTF3mIx1zFGQ5-fTvuV2g4mN7ORxZ539BMmugRLcXLabkoopEGC1HE-UCpJpJQfY/exec';

// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    // ===================================================================
    // LOGIC CHUYỂN TAB
    // ===================================================================
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });

    // ===================================================================
    // PDF VIEWER LOGIC
    // ===================================================================
    const pdfViewer = {
        container: document.getElementById('pdf-viewer-container'),
        wrapper: document.getElementById('pdf-viewer-wrapper'),
        frames: document.querySelectorAll('.pdf-frame'),
        grip: document.getElementById('resize-grip'),
        cache: [],
        currentIndex: 0
    };

    // Resize grip functionality
    let isResizing = false;
    let startY, startHeight;

    pdfViewer.grip.addEventListener('mousedown', (e) => {
        isResizing = true;
        startY = e.clientY;
        startHeight = pdfViewer.wrapper.offsetHeight;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const delta = e.clientY - startY;
        const newHeight = Math.max(200, Math.min(800, startHeight + delta));
        pdfViewer.wrapper.style.height = newHeight + 'px';
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
    });

    // Load PDF in viewer
    let currentPdfUrl = null;
    function loadPDFInViewer(url) {
        currentPdfUrl = url;
        pdfViewer.container.style.display = 'block';
        
        let cacheIndex = pdfViewer.cache.indexOf(url);
        
        if (cacheIndex === -1) {
            cacheIndex = pdfViewer.currentIndex;
            pdfViewer.cache[cacheIndex] = url;
            pdfViewer.frames[cacheIndex].src = url + '#view=Fit';
            pdfViewer.currentIndex = (pdfViewer.currentIndex + 1) % pdfViewer.frames.length;
        }
        
        pdfViewer.frames.forEach((frame, index) => {
            frame.style.display = (index === cacheIndex) ? 'block' : 'none';
        });
    }

    // ===================================================================
    // VIEW LOGIC (Quick View & Ghost View)
    // ===================================================================
    function openQuickView(url) {
        const viewerUrl = chrome.runtime.getURL('fullscreen_viewer.html') + '?url=' + encodeURIComponent(url);
        chrome.windows.create({
            url: viewerUrl,
            type: 'popup',
            state: 'maximized'
        });
    }

    function broadcastFileListUpdate() {
        let combinedFiles = [...allDiscoveredFiles];
        if (typeof REFERENCE_DOCUMENTS !== 'undefined') {
            const refs = REFERENCE_DOCUMENTS.map(d => ({ name: d.title, url: d.url }));
            combinedFiles = [...combinedFiles, ...refs];
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    type: 'UPDATE_GHOST_FILE_LIST', 
                    fileList: combinedFiles
                }).catch(() => {});
            }
        });
    }

    function sendGhostMessage(url) {
        let combinedFiles = [...allDiscoveredFiles];
        if (typeof REFERENCE_DOCUMENTS !== 'undefined') {
            const refs = REFERENCE_DOCUMENTS.map(d => ({ name: d.title, url: d.url }));
            combinedFiles = [...combinedFiles, ...refs];
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    type: 'SHOW_GHOST_VIEW', 
                    url: url,
                    fileList: combinedFiles
                });
            }
        });
    }

    window.openQuickView = openQuickView;
    window.sendGhostMessage = sendGhostMessage;

    const quickViewMainBtn = document.getElementById('quick-view-main');
    quickViewMainBtn.addEventListener('click', () => {
        if (currentPdfUrl) openQuickView(currentPdfUrl);
    });

    const ghostViewMainBtn = document.getElementById('ghost-view-main');
    ghostViewMainBtn.addEventListener('click', () => {
        if (currentPdfUrl) sendGhostMessage(currentPdfUrl);
    });

    // ===================================================================
    // DỮ LIỆU GHI CHÚ QUỐC GIA
    // ===================================================================
    const countryNotes = {
        "Hoa Kỳ": "- Do US-FDA không cấp giấy GMP hoặc Giấy phép sản xuất, doanh nghiệp phải cung cấp tài liệu pháp lý thay thế là Báo cáo thanh tra GMP kèm Công văn của US-FDA gửi công ty về việc gửi Báo cáo thanh tra GMP (bản chứng thực HPHLS).\n- Trường hợp Báo cáo thanh tra GMP gần nhất liên quan đến phạm vi đề nghị đánh giá đã vượt quá 03 năm, doanh nghiệp phải bổ sung:\n+ Báo cáo thanh tra GMP tại cơ sở sản xuất trong vòng 3 năm có liên quan đến hệ thống chất lượng của cơ sở (bản chứng thực HPHLS).\n+ Bản chụp màn hình thông tin tại Website Drug Establishments Current Registration Site (fda.gov): xác định tình trạng đăng ký hoạt động của cơ sở sản xuất cập nhật hằng năm.\n+ Bản chụp màn hình thông tin tại Website FDA Dashboards - Inspections: xác định thời gian kiểm tra GMP gần nhất.\n- Trường hợp không có đợt thanh tra GMP của US-FDA trong vòng 3 năm hoặc báo cáo bị che thông tin hoặc chưa được chứng thực HPHLS, doanh nghiệp phải bổ sung:\n+ Email xác nhận đáp ứng US-cGMP (cGMP declaration) được gửi trực tiếp từ US-FDA tới email của Cục QLD hoặc email công vụ của Phòng QLCL thuốc.\n+ Bản chụp màn hình thông tin tại Website Drug Establishments Current Registration Site (fda.gov).\n+ Bản chụp màn hình thông tin tại Website FDA Dashboards - Inspections.",
        "Nhật Bản": "- Do mẫu giấy GMP của cơ quan quản lý Nhật Bản không có đủ thông tin để đánh giá, doanh nghiệp phải cung cấp Báo cáo thanh tra GMP (bản chứng thực HPHLS).\n- Trường hợp không có báo cáo này, có thể thay bằng Notification of GMP inspection result kèm danh sách thuốc được đánh giá, cùng một trong các tài liệu sau:\n+ Giấy CPP của sản phẩm.\n+ Giấy GMP của sản phẩm.\n+ Giấy GMP tương ứng với báo cáo thanh tra được công bố trên EUDRA.",
        "Canada": "- Giấy GMP của Canada chỉ thể hiện đáp ứng WHO-GMP, nên phải bổ sung tài liệu hợp pháp hóa lãnh sự:\n+ Giấy phép sản xuất, Báo cáo thanh tra hoặc tài liệu căn cứ xác định Canada-GMP.\n- Nếu chỉ có Giấy phép sản xuất, cần thêm:\n+ Tài liệu xác định hạn hiệu lực, Báo cáo thanh tra kèm tài liệu xác định hiệu lực, hoặc CPP của sản phẩm (trong trường hợp này hạn hiệu lực theo CPP).",
        "Cộng hòa Nhân dân Trung Hoa": "Lưu ý:\n- Từ năm 2020 TQ không cấp Giấy chứng nhận GMP.\n- Phải nộp Giấy phép sản xuất do cơ quan cấp tỉnh hoặc trung ương cấp.",
        "Argentina": "Lưu ý:\n- Cấp Giấy chứng nhận GMP theo nhiều định dạng.\n- Phải nộp giấy có đủ thông tin về ngày kiểm tra và dạng bào chế, phù hợp với Báo cáo thanh tra.",
        "Thổ Nhĩ Kỳ": "Lưu ý:\n- Báo cáo thanh tra của cơ quan Thổ Nhĩ Kỳ có thể bị che thông tin, nhưng không ảnh hưởng đến nội dung cần đánh giá."
    };

    // ===================================================================
    // DROPDOWN SELECTOR
    // ===================================================================
    const dropdownContainer = document.getElementById('dropdown-container');
    const fileDropdown = document.getElementById('file-dropdown');
    
    const dropdownFileMap = new Map();
    let dropdownFileCount = 0;
    let allDiscoveredFiles = [];

    fileDropdown.addEventListener('change', (e) => {
        const selectedIndex = e.target.value;
        if (selectedIndex && dropdownFileMap.has(selectedIndex)) {
            const fileUrl = dropdownFileMap.get(selectedIndex);
            loadPDFInViewer(fileUrl);
        }
    });

    // ===================================================================
    // PHẦN TỰ TÍNH NĂNG GHI CHÚ
    // ===================================================================
    const noteFieldset = document.getElementById('note-fieldset');
    const noteLabel = document.getElementById('noteLabel');
    const noteContainerWrapper = document.getElementById('note-container-wrapper');
    const saveBtn = document.getElementById('saveBtn');
    const viewAllNotesBtn = document.getElementById('viewAllNotesBtn');

    const readingNotesTextarea = document.getElementById('readingNotesTextarea');
    const facilityName = document.getElementById('facilityName');
    const facilityAddress = document.getElementById('facilityAddress');
    const certScope = document.getElementById('certScope');
    const publishedScope = document.getElementById('publishedScope');
    const gmpPrinciple = document.getElementById('gmpPrinciple');
    const certNumber = document.getElementById('certNumber');
    const issueDate = document.getElementById('issueDate');
    const expiryDate = document.getElementById('expiryDate');
    const issuingAuthority = document.getElementById('issuingAuthority');
    
    let currentDossierCode = null;

    // ===================================================================
    // PHẦN TỰ TÍNH NĂNG DANH MỤC PDF
    // ===================================================================
    const fileListEl = document.getElementById('file-list');
    const statusEl = document.getElementById('status');
    let totalFiles = 0;
    let foundCount = 0;
    let errorCount = 0;
    let pdfWindowId = null;

    // ===================================================================
    // LOGIC GHI CHÚ - LƯU LÊN GOOGLE SHEET
    // ===================================================================
    function getDossierCode() {
        const result = {
            dossierCode: null,
            hostCountry: null
        };

        const divs = document.querySelectorAll('div.caption.ng-binding');
        for (const div of divs) {
            if (div.textContent.includes('THẨM ĐỊNH HỒ SƠ:')) {
                const parts = div.textContent.split(':');
                if (parts.length > 1) {
                    result.dossierCode = parts[1].trim();
                    break;
                }
            }
        }

        const countryElement = document.querySelector('div[ng-if="vm.hoSo.donHang.nuocSoTai"] span.ng-binding');
        if (countryElement) {
            result.hostCountry = countryElement.textContent.trim();
        }

        return result;
    }

    async function saveToSheet(dossierCode, noteData) {
        if (!WEB_APP_URL) {
            alert('⚠️ Chưa cấu hình Web App URL trong sidepanel.js');
            return false;
        }

        try {
            const cleanUrl = WEB_APP_URL.replace(/\/macros\/u\/\d+\/s\//, '/macros/s/');
            
            const response = await fetch(cleanUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dossierCode: dossierCode,
                    readingNotes: noteData.readingNotes || '',
                    facilityName: noteData.publishedInfo?.facilityName || '',
                    facilityAddress: noteData.publishedInfo?.facilityAddress || '',
                    certScope: noteData.publishedInfo?.certScope || '',
                    publishedScope: noteData.publishedInfo?.publishedScope || '',
                    gmpPrinciple: noteData.publishedInfo?.gmpPrinciple || '',
                    certNumber: noteData.publishedInfo?.certNumber || '',
                    issueDate: noteData.publishedInfo?.issueDate || '',
                    expiryDate: noteData.publishedInfo?.expiryDate || '',
                    issuingAuthority: noteData.publishedInfo?.issuingAuthority || ''
                })
            });

            return true;
        } catch (error) {
            console.error('Lỗi khi lưu lên Sheet:', error);
            alert('❌ Không thể lưu ghi chú. Kiểm tra kết nối mạng và Web App URL.');
            return false;
        }
    }

    async function fetchNoteByCode(dossierCode) {
        if (!WEB_APP_URL || !dossierCode) return;

        saveBtn.textContent = '🔄 Đang kiểm tra dữ liệu cũ...';
        saveBtn.disabled = true;

        try {
            const cleanUrl = WEB_APP_URL.replace(/\/macros\/u\/\d+\/s\//, '/macros/s/');
            const response = await fetch(`${cleanUrl}?q=${encodeURIComponent(dossierCode)}`);
            const results = await response.json();

            // Tìm kết quả khớp chính xác mã hồ sơ
            const exactMatch = results.find(item => item.dossierCode === dossierCode);

            if (exactMatch) {
                fillNoteForm(exactMatch);
                saveBtn.textContent = '✅ Đã tải dữ liệu cũ';
                setTimeout(() => {
                    saveBtn.textContent = 'Lưu Ghi Chú';
                    saveBtn.disabled = false;
                }, 1500);
            } else {
                saveBtn.textContent = 'Lưu Ghi Chú';
                saveBtn.disabled = false;
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu cũ:', error);
            saveBtn.textContent = 'Lưu Ghi Chú';
            saveBtn.disabled = false;
        }
    }

    function fillNoteForm(data) {
        readingNotesTextarea.value = data.readingNotes || '';
        facilityName.value = data.facilityName || '';
        facilityAddress.value = data.facilityAddress || '';
        certScope.value = data.certScope || '';
        publishedScope.value = data.publishedScope || '';
        gmpPrinciple.value = data.gmpPrinciple || '';
        certNumber.value = data.certNumber || '';
        
        // Xử lý định dạng ngày (nếu có)
        if (data.issueDate) {
            try {
                const date = new Date(data.issueDate);
                if (!isNaN(date)) issueDate.value = date.toISOString().split('T')[0];
            } catch(e) {}
        }
        if (data.expiryDate) {
            try {
                const date = new Date(data.expiryDate);
                if (!isNaN(date)) expiryDate.value = date.toISOString().split('T')[0];
            } catch(e) {}
        }
        
        issuingAuthority.value = data.issuingAuthority || '';
    }

    // ===================================================================
    // LOGIC BỘ NHỚ PHIÊN (SESSION STORAGE)
    // ===================================================================
    async function saveSessionData() {
        if (!currentDossierCode) return;
        
        const sessionData = {
            dossierCode: currentDossierCode,
            files: allDiscoveredFiles,
            noteData: {
                readingNotes: readingNotesTextarea.value,
                facilityName: facilityName.value,
                facilityAddress: facilityAddress.value,
                certScope: certScope.value,
                publishedScope: publishedScope.value,
                gmpPrinciple: gmpPrinciple.value,
                certNumber: certNumber.value,
                issueDate: issueDate.value,
                expiryDate: expiryDate.value,
                issuingAuthority: issuingAuthority.value
            }
        };
        
        const key = `SESSION_DATA_${currentDossierCode}`;
        await chrome.storage.session.set({ [key]: sessionData });
    }

    async function loadSessionData(dossierCode) {
        const key = `SESSION_DATA_${dossierCode}`;
        const result = await chrome.storage.session.get(key);
        const data = result[key];
        
        if (!data) return false;
        
        // 1. Phục hồi danh sách file
        allDiscoveredFiles = data.files || [];
        allDiscoveredFiles.forEach(file => {
            addFileToListUI(file);
        });
        
        if (allDiscoveredFiles.length > 0) {
            statusEl.textContent = `Đã tải ${allDiscoveredFiles.length} file từ bộ nhớ.`;
        }

        // 2. Phục hồi ghi chú nháp
        if (data.noteData) {
            readingNotesTextarea.value = data.noteData.readingNotes || '';
            facilityName.value = data.noteData.facilityName || '';
            facilityAddress.value = data.noteData.facilityAddress || '';
            certScope.value = data.noteData.certScope || '';
            publishedScope.value = data.noteData.publishedScope || '';
            gmpPrinciple.value = data.noteData.gmpPrinciple || '';
            certNumber.value = data.noteData.certNumber || '';
            issueDate.value = data.noteData.issueDate || '';
            expiryDate.value = data.noteData.expiryDate || '';
            issuingAuthority.value = data.noteData.issuingAuthority || '';
        }
        
        return true;
    }

    function addFileToListUI(file) {
        const li = document.createElement('li');
        li.textContent = `📄 ${file.name}`;
        li.title = `Mở file: ${file.name}`;
        li.classList.add('clickable');
        li.dataset.fileUrl = file.url;
        
        li.addEventListener('click', () => {
            const fileUrl = li.dataset.fileUrl;
            loadPDFInViewer(fileUrl);
            document.querySelectorAll('#file-list li').forEach(item => {
                item.classList.remove('viewing');
            });
            li.classList.add('viewing');
        });
        
        fileListEl.appendChild(li);
        
        dropdownFileCount++;
        const option = document.createElement('option');
        option.value = dropdownFileCount;
        option.textContent = `📄 ${file.name}`;
        fileDropdown.appendChild(option);
        dropdownFileMap.set(dropdownFileCount.toString(), file.url);
    }

    // Tự động lưu khi gõ
    const formInputs = [
        readingNotesTextarea, facilityName, facilityAddress, certScope, 
        publishedScope, gmpPrinciple, certNumber, issueDate, expiryDate, issuingAuthority
    ];
    formInputs.forEach(input => {
        input.addEventListener('input', saveSessionData);
    });

    async function initializeNoteFeature() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        const oldIcon = document.getElementById('country-note-icon');
        if (oldIcon) oldIcon.remove();
        const oldTooltip = document.querySelector('.country-note-tooltip-content');
        if (oldTooltip) oldTooltip.remove();
	noteContainerWrapper.classList.remove('note-container');
        const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: getDossierCode,
        });

        const pageData = injectionResults[0].result;
        const dossierCode = pageData.dossierCode;
        const hostCountry = pageData.hostCountry;

        if (dossierCode) {
            currentDossierCode = dossierCode;
            noteLabel.textContent = `Ghi chú hồ sơ số: ${currentDossierCode}`;
            noteFieldset.disabled = false;

            // Kiểm tra bộ nhớ phiên trước
            const hasCachedData = await loadSessionData(dossierCode);
            
            if (!hasCachedData) {
                // Nếu không có cache mới gửi lệnh quét PDF
                chrome.runtime.sendMessage({ type: 'SIDEPANEL_READY' });
                
                readingNotesTextarea.value = '';
                facilityName.value = '';
                facilityAddress.value = '';
                certScope.value = '';
                publishedScope.value = '';
                gmpPrinciple.value = '';
                certNumber.value = '';
                issueDate.value = '';
                expiryDate.value = '';
                issuingAuthority.value = '';

                // Tự động tải dữ liệu từ Sheet (chỉ khi không có cache)
                fetchNoteByCode(dossierCode);
            }

            if (hostCountry && countryNotes[hostCountry]) {
                const noteText = countryNotes[hostCountry];
                noteContainerWrapper.classList.add('note-container');

                const icon = document.createElement('span');
                icon.id = 'country-note-icon';
                icon.textContent = ' ℹ️';
                noteLabel.appendChild(icon);

                const tooltip = document.createElement('div');
                tooltip.className = 'country-note-tooltip-content';
                tooltip.textContent = noteText;
                noteContainerWrapper.appendChild(tooltip);
            }
        } else {
            noteLabel.textContent = 'Ghi chú hồ sơ:';
            noteFieldset.disabled = true;
        }
    }
    
    saveBtn.addEventListener('click', async () => {
        if (!currentDossierCode) {
            alert('Không tìm thấy mã hồ sơ để lưu.');
            return;
        }

        const noteData = {
            readingNotes: readingNotesTextarea.value,
            publishedInfo: {
                facilityName: facilityName.value, 
                facilityAddress: facilityAddress.value,
                certScope: certScope.value, 
                publishedScope: publishedScope.value,
                gmpPrinciple: gmpPrinciple.value, 
                certNumber: certNumber.value,
                issueDate: issueDate.value, 
                expiryDate: expiryDate.value,
                issuingAuthority: issuingAuthority.value,
            }
        };

        saveBtn.textContent = 'Đang lưu...';
        saveBtn.disabled = true;

        const success = await saveToSheet(currentDossierCode, noteData);
        
        if (success) {
            saveBtn.textContent = 'Đã lưu!';
            setTimeout(() => {
                saveBtn.textContent = 'Lưu Ghi Chú';
                saveBtn.disabled = false;
            }, 2000);
        } else {
            saveBtn.textContent = 'Lưu Ghi Chú';
            saveBtn.disabled = false;
        }
    });

    viewAllNotesBtn.addEventListener('click', () => {
        if (!SHEET_URL) {
            alert('⚠️ Chưa cấu hình Sheet URL trong sidepanel.js');
            return;
        }
        chrome.tabs.create({ url: SHEET_URL });
    });

    // ===================================================================
    // LOGIC DANH MỤC PDF
    // ===================================================================

    chrome.runtime.onMessage.addListener((message) => {
        switch (message.type) {
            case 'RESET':
                fileListEl.innerHTML = '';
                statusEl.textContent = 'Đang chờ tín hiệu...';
                pdfWindowId = null;
                fileDropdown.innerHTML = '<option value="">-- Chọn tài liệu để xem --</option>';
                dropdownFileMap.clear();
                dropdownFileCount = 0;
                allDiscoveredFiles = [];
                
                pdfViewer.container.style.display = 'none';
                pdfViewer.cache = [];
                pdfViewer.frames.forEach(frame => {
                    frame.src = '';
                    frame.style.display = 'none';
                });
                break;

            case 'PROCESS_START':
                fileListEl.innerHTML = '';
                statusEl.textContent = 'Bắt đầu quét...';
                totalFiles = 0;
                foundCount = 0;
                errorCount = 0;
                pdfWindowId = null;
                allDiscoveredFiles = [];
                
                fileDropdown.innerHTML = '<option value="">-- Chọn tài liệu để xem --</option>';
                dropdownFileMap.clear();
                dropdownFileCount = 0;
                break;
                
            case 'PROCESS_TOTAL':
                totalFiles = message.total;
                updateStatus();
                break;
                
            case 'FILE_FOUND':
                foundCount++;
                
                // Lưu vào danh sách
                const newFile = { name: message.file.name, url: message.file.url };
                allDiscoveredFiles.push(newFile);
                broadcastFileListUpdate();
                saveSessionData(); // Lưu vào bộ nhớ phiên ngay lập tức

                addFileToListUI(newFile);
                updateStatus();
                break;
                
            case 'FILE_ERROR':
                errorCount++;
                const liError = document.createElement('li');
                liError.textContent = `❌ ${message.name} (Không tìm thấy link)`;
                liError.style.color = 'red';
                fileListEl.appendChild(liError);
                updateStatus();
                break;

            case 'PROCESS_COMPLETE':
                statusEl.textContent = `Hoàn tất! Tìm thấy ${foundCount} file.`;
                break;
        }
    });
    
    function updateStatus() {
        const processedCount = foundCount + errorCount;
        if (totalFiles > 0) {
             statusEl.textContent = `Đã xử lý ${processedCount}/${totalFiles}... (Tìm thấy: ${foundCount})`;
        } else {
            statusEl.textContent = `Đang quét... (Tìm thấy: ${foundCount})`;
        }
    }

    // ===================================================================
    // TÌM KIẾM
    // ===================================================================
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            searchResults.innerHTML = '';
            return;
        }

        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 500);
    });

    async function performSearch(query) {
        if (!WEB_APP_URL) {
            searchResults.innerHTML = '<div id="search-empty">⚠️ Chưa cấu hình Web App URL</div>';
            return;
        }

        searchResults.innerHTML = '<div id="search-loading">🔄 Đang tìm kiếm...</div>';

        try {
            const cleanUrl = WEB_APP_URL.replace(/\/macros\/u\/\d+\/s\//, '/macros/s/');
            const response = await fetch(`${cleanUrl}?q=${encodeURIComponent(query)}`);
            const results = await response.json();

            if (results.length === 0) {
                searchResults.innerHTML = '<div id="search-empty">Không tìm thấy kết quả</div>';
                return;
            }

            searchResults.innerHTML = '';
            results.forEach(item => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                
                const codeDiv = document.createElement('div');
                codeDiv.className = 'search-result-code';
                codeDiv.textContent = `📄 ${item.dossierCode}`;
                
                const noteDiv = document.createElement('div');
                noteDiv.className = 'search-result-note';
                noteDiv.textContent = item.readingNotes || '(Không có ghi chú)';
                
                div.appendChild(codeDiv);
                div.appendChild(noteDiv);
                
                div.addEventListener('click', () => {
                    showDetailModal(item);
                });
                
                searchResults.appendChild(div);
            });

        } catch (error) {
            console.error('Lỗi tìm kiếm:', error);
            searchResults.innerHTML = '<div id="search-empty">❌ Lỗi kết nối. Kiểm tra Web App URL.</div>';
        }
    }

    function showDetailModal(item) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white; padding: 20px; border-radius: 8px;
            max-width: 500px; max-height: 80vh; overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        content.innerHTML = `
            <h2 style="margin-top: 0; color: #007bff;">📄 ${item.dossierCode}</h2>
            <div style="margin-bottom: 15px;">
                <strong>Ghi chú đọc hồ sơ:</strong>
                <pre style="white-space: pre-wrap; background: #f5f5f5; padding: 10px; border-radius: 4px;">${item.readingNotes || '(Không có)'}</pre>
            </div>
            <hr>
            <h3>Thông tin công bố</h3>
            <table style="width: 100%; font-size: 13px;">
                <tr><td style="padding: 5px;"><strong>Cơ sở SX:</strong></td><td style="padding: 5px;">${item.facilityName || ''}</td></tr>
                <tr><td style="padding: 5px;"><strong>Địa chỉ:</strong></td><td style="padding: 5px;">${item.facilityAddress || ''}</td></tr>
                <tr><td style="padding: 5px;"><strong>Phạm vi giấy:</strong></td><td style="padding: 5px;">${item.certScope || ''}</td></tr>
                <tr><td style="padding: 5px;"><strong>Phạm vi CB:</strong></td><td style="padding: 5px;">${item.publishedScope || ''}</td></tr>
                <tr><td style="padding: 5px;"><strong>GMP:</strong></td><td style="padding: 5px;">${item.gmpPrinciple || ''}</td></tr>
                <tr><td style="padding: 5px;"><strong>Số GCN:</strong></td><td style="padding: 5px;">${item.certNumber || ''}</td></tr>
                <tr><td style="padding: 5px;"><strong>Ngày cấp:</strong></td><td style="padding: 5px;">${item.issueDate || ''}</td></tr>
                <tr><td style="padding: 5px;"><strong>Ngày HH:</strong></td><td style="padding: 5px;">${item.expiryDate || ''}</td></tr>
                <tr><td style="padding: 5px;"><strong>Cơ quan cấp:</strong></td><td style="padding: 5px;">${item.issuingAuthority || ''}</td></tr>
            </table>
            <button id="close-modal" style="margin-top: 15px; padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Đóng</button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        const closeModal = () => { document.body.removeChild(modal); };
        content.querySelector('#close-modal').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }

    initializeNoteFeature();
});
