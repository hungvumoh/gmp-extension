document.addEventListener('DOMContentLoaded', () => {
    const notesContainer = document.getElementById('notes-container');
    const loadingMessage = document.getElementById('loading');
    const storageProgress = document.getElementById('storage-progress');
    const storageText = document.getElementById('storage-text');
    const exportBtn = document.getElementById('export-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const importJsonBtn = document.getElementById('import-json-btn');
    const deleteAllBtn = document.getElementById('delete-all-btn');

    const QUOTA_BYTES = 102400;

    async function updateStorageUsage() {
        const bytesInUse = await chrome.storage.sync.getBytesInUse(null);
        const percentage = (bytesInUse / QUOTA_BYTES) * 100;

        storageProgress.value = bytesInUse;
        storageText.textContent = `${(bytesInUse / 1024).toFixed(2)} / 100 KB (${percentage.toFixed(1)}%)`;

        storageProgress.className = '';
        if (percentage >= 90) {
            storageProgress.classList.add('usage-critical');
        } else if (percentage >= 75) {
            storageProgress.classList.add('usage-warning');
        } else {
            storageProgress.classList.add('usage-normal');
        }
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(dateString)) {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        }
        return dateString;
    }

    function formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString('vi-VN');
    }

    async function saveNote(dossierCode, noteData) {
        noteData.lastModified = new Date().toISOString();
        await chrome.storage.sync.set({ [dossierCode]: noteData });
        await updateStorageUsage();
    }

    function createEditForm(dossierCode, noteData) {
        const formDiv = document.createElement('div');
        formDiv.className = 'edit-form';
        
        const info = noteData.publishedInfo || {};
        
        formDiv.innerHTML = `
            <label>Ghi chú đọc hồ sơ</label>
            <textarea id="edit-readingNotes-${dossierCode}">${noteData.readingNotes || ''}</textarea>
            
            <h3 style="margin-top: 20px; margin-bottom: 10px;">Thông tin công bố</h3>
            
            <label>Cơ sở sản xuất</label>
            <textarea id="edit-facilityName-${dossierCode}" rows="2">${info.facilityName || ''}</textarea>
            
            <label>Địa chỉ cơ sở sản xuất</label>
            <textarea id="edit-facilityAddress-${dossierCode}" rows="2">${info.facilityAddress || ''}</textarea>
            
            <label>Phạm vi trên giấy</label>
            <textarea id="edit-certScope-${dossierCode}" rows="2">${info.certScope || ''}</textarea>
            
            <label>Phạm vi công bố</label>
            <textarea id="edit-publishedScope-${dossierCode}" rows="2">${info.publishedScope || ''}</textarea>
            
            <label>Nguyên tắc GMP</label>
            <textarea id="edit-gmpPrinciple-${dossierCode}" rows="2">${info.gmpPrinciple || ''}</textarea>
            
            <label>Số Giấy chứng nhận</label>
            <textarea id="edit-certNumber-${dossierCode}" rows="2">${info.certNumber || ''}</textarea>
            
            <div class="form-row">
                <div>
                    <label>Ngày cấp</label>
                    <input type="date" id="edit-issueDate-${dossierCode}" value="${info.issueDate || ''}">
                </div>
                <div>
                    <label>Ngày hết hạn</label>
                    <input type="date" id="edit-expiryDate-${dossierCode}" value="${info.expiryDate || ''}">
                </div>
            </div>
            
            <label>Cơ quan cấp</label>
            <textarea id="edit-issuingAuthority-${dossierCode}" rows="2">${info.issuingAuthority || ''}</textarea>
        `;
        
        return formDiv;
    }

    function createViewContent(dossierCode, noteData) {
        const viewDiv = document.createElement('div');
        viewDiv.className = 'view-content';
        
        if (noteData.lastModified) {
            const timestampDiv = document.createElement('div');
            timestampDiv.className = 'last-modified';
            timestampDiv.textContent = `Sửa lần cuối: ${formatTimestamp(noteData.lastModified)}`;
            viewDiv.appendChild(timestampDiv);
        }
        
        if (noteData.readingNotes) {
            const readingTitle = document.createElement('h3');
            readingTitle.textContent = 'Ghi chú đọc hồ sơ';
            const readingContent = document.createElement('pre');
            readingContent.textContent = noteData.readingNotes;
            viewDiv.appendChild(readingTitle);
            viewDiv.appendChild(readingContent);
        }

        if (noteData.publishedInfo) {
            const infoTitle = document.createElement('h3');
            infoTitle.textContent = 'Thông tin công bố';
            viewDiv.appendChild(infoTitle);

            const table = document.createElement('table');
            table.className = 'info-table';
            
            const info = noteData.publishedInfo;
            const headers = ['Cơ sở sản xuất', 'Địa chỉ', 'Phạm vi trên giấy', 'Phạm vi công bố', 'Nguyên tắc GMP', 'Số GCN', 'Ngày cấp', 'Ngày hết hạn', 'Cơ quan cấp'];
            const values = [info.facilityName, info.facilityAddress, info.certScope, info.publishedScope, info.gmpPrinciple, info.certNumber, info.issueDate, info.expiryDate, info.issuingAuthority];

            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });

            const tbody = table.createTBody();
            const bodyRow = tbody.insertRow();
            values.forEach((valueText, index) => {
                const td = bodyRow.insertCell();
                let displayValue = valueText || '';
                if (index === 6 || index === 7) {
                    displayValue = formatDate(displayValue);
                }
                if (index < 6 || index === 8) {
                     td.innerHTML = `<pre>${displayValue}</pre>`;
                } else {
                     td.textContent = displayValue;
                }
            });

            viewDiv.appendChild(table);

            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copy';
            copyBtn.className = 'copy-btn';
            copyBtn.addEventListener('click', () => {
                const formattedValues = values.map(v => {
                    let cellValue = (v || '').toString();
                    if (cellValue.includes('\n') || cellValue.includes('\t') || cellValue.includes('"')) {
                        cellValue = cellValue.replace(/"/g, '""');
                        cellValue = `"${cellValue}"`;
                    }
                    return cellValue;
                });
                
                const rowText = formattedValues.join('\t');
                navigator.clipboard.writeText(rowText).then(() => {
                    alert('Đã copy dữ liệu vào clipboard.');
                }).catch(err => {
                    console.error('Lỗi khi copy:', err);
                    alert('Không thể copy dữ liệu.');
                });
            });
            viewDiv.appendChild(copyBtn);
        }
        
        return viewDiv;
    }

    async function renderAllNotes() {
        const style = document.createElement('style');
        style.textContent = `
            .info-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .info-table th, .info-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 0.9em; vertical-align: top; }
            .info-table th { background-color: #f2f2f2; font-weight: bold; }
            .note-entry h3 { margin-top: 15px; margin-bottom: 5px; font-size: 1.1em; color: #333; }
            .info-table td pre { margin: 0; white-space: pre-wrap; word-wrap: break-word; font-family: sans-serif; }
            .copy-btn { float: right; background-color: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; }
            .copy-btn:hover { background-color: #0056b3; }
        `;
        document.head.appendChild(style);

        try {
            notesContainer.innerHTML = '';
            const allNotes = await chrome.storage.sync.get(null);
            const noteKeys = Object.keys(allNotes);

            if (noteKeys.length === 0) {
                notesContainer.innerHTML = '<p id="empty">Chưa có ghi chú nào được lưu.</p>';
                return;
            }

            noteKeys.sort();

            for (const dossierCode of noteKeys) {
                const noteData = allNotes[dossierCode];
                if (!noteData || (typeof noteData !== 'object')) continue;

                const noteEntryDiv = document.createElement('div');
                noteEntryDiv.className = 'note-entry';
                noteEntryDiv.dataset.dossierCode = dossierCode;
                
                const titleDiv = document.createElement('div');
                titleDiv.style.display = 'flex';
                titleDiv.style.justifyContent = 'space-between';
                titleDiv.style.alignItems = 'center';
                
                const title = document.createElement('h2');
                title.textContent = `Hồ sơ: ${dossierCode}`;
                titleDiv.appendChild(title);
                
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Sửa';
                editBtn.className = 'edit-btn';
                editBtn.onclick = () => toggleEditMode(noteEntryDiv, dossierCode, noteData);
                titleDiv.appendChild(editBtn);
                
                noteEntryDiv.appendChild(titleDiv);
                
                const viewContent = createViewContent(dossierCode, noteData);
                noteEntryDiv.appendChild(viewContent);
                
                notesContainer.appendChild(noteEntryDiv);
            }
        } catch (error) {
            notesContainer.innerHTML = '<p>Đã xảy ra lỗi khi tải dữ liệu.</p>';
            console.error("Lỗi khi lấy ghi chú:", error);
        }
    }

    function toggleEditMode(noteEntryDiv, dossierCode, noteData) {
        const viewContent = noteEntryDiv.querySelector('.view-content');
        const existingForm = noteEntryDiv.querySelector('.edit-form');
        const editBtn = noteEntryDiv.querySelector('.edit-btn');
        
        if (existingForm) {
            existingForm.remove();
            viewContent.style.display = 'block';
            editBtn.textContent = 'Sửa';
            editBtn.className = 'edit-btn';
            editBtn.onclick = () => toggleEditMode(noteEntryDiv, dossierCode, noteData);
        } else {
            viewContent.style.display = 'none';
            
            const editForm = createEditForm(dossierCode, noteData);
            noteEntryDiv.appendChild(editForm);
            
            editBtn.textContent = 'Lưu';
            editBtn.className = 'save-btn';
            editBtn.onclick = async () => {
                const updatedNote = {
                    readingNotes: document.getElementById(`edit-readingNotes-${dossierCode}`).value,
                    publishedInfo: {
                        facilityName: document.getElementById(`edit-facilityName-${dossierCode}`).value,
                        facilityAddress: document.getElementById(`edit-facilityAddress-${dossierCode}`).value,
                        certScope: document.getElementById(`edit-certScope-${dossierCode}`).value,
                        publishedScope: document.getElementById(`edit-publishedScope-${dossierCode}`).value,
                        gmpPrinciple: document.getElementById(`edit-gmpPrinciple-${dossierCode}`).value,
                        certNumber: document.getElementById(`edit-certNumber-${dossierCode}`).value,
                        issueDate: document.getElementById(`edit-issueDate-${dossierCode}`).value,
                        expiryDate: document.getElementById(`edit-expiryDate-${dossierCode}`).value,
                        issuingAuthority: document.getElementById(`edit-issuingAuthority-${dossierCode}`).value,
                    }
                };
                
                await saveNote(dossierCode, updatedNote);
                await renderAllNotes();
                alert('Đã lưu thành công!');
            };
            
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Hủy';
            cancelBtn.className = 'cancel-btn';
            cancelBtn.onclick = () => {
                editForm.remove();
                viewContent.style.display = 'block';
                editBtn.textContent = 'Sửa';
                editBtn.className = 'edit-btn';
                cancelBtn.remove();
                editBtn.onclick = () => toggleEditMode(noteEntryDiv, dossierCode, noteData);
            };
            
            editBtn.parentNode.appendChild(cancelBtn);
        }
    }

    exportBtn.addEventListener('click', async () => {
        const allNotes = await chrome.storage.sync.get(null);
        const noteKeys = Object.keys(allNotes);

        if (noteKeys.length === 0) {
            alert('Không có ghi chú nào để xuất.');
            return;
        }

        let fileContent = `GHI CHÚ HỒ SƠ DỊCH VỤ CÔNG - Dữ liệu xuất ngày ${new Date().toLocaleString('vi-VN')}\n\n`;
        
        noteKeys.sort();

        for (const dossierCode of noteKeys) {
            const noteData = allNotes[dossierCode];
            if (!noteData || (typeof noteData !== 'object')) continue;

            fileContent += `========================================\n`;
            fileContent += `HỒ SƠ: ${dossierCode}\n`;
            if (noteData.lastModified) {
                fileContent += `Sửa lần cuối: ${formatTimestamp(noteData.lastModified)}\n`;
            }
            fileContent += `========================================\n\n`;
            
            fileContent += `--- GHI CHÚ ĐỌC HỒ SƠ ---\n`;
            fileContent += `${noteData.readingNotes || '(không có ghi chú)'}\n\n`;

            fileContent += `--- THÔNG TIN CÔNG BỐ ---\n`;
            if (noteData.publishedInfo) {
                const info = noteData.publishedInfo;
                fileContent += `Cơ sở sản xuất   : ${info.facilityName || ''}\n`;
                fileContent += `Địa chỉ CSXS      : ${info.facilityAddress || ''}\n`;
                fileContent += `Phạm vi trên giấy : ${info.certScope || ''}\n`;
                fileContent += `Phạm vi công bố   : ${info.publishedScope || ''}\n`;
                fileContent += `Nguyên tắc GMP     : ${info.gmpPrinciple || ''}\n`;
                fileContent += `Số GCN            : ${info.certNumber || ''}\n`;
                fileContent += `Ngày cấp          : ${formatDate(info.issueDate)}\n`;
                fileContent += `Ngày hết hạn      : ${formatDate(info.expiryDate)}\n`;
                fileContent += `Cơ quan cấp       : ${info.issuingAuthority || ''}\n`;
            } else {
                fileContent += `(không có thông tin)\n`;
            }
            fileContent += `\n\n`;
        }
        
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ghi_chu_ho_so_DVC.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });

    exportJsonBtn.addEventListener('click', async () => {
        const allNotes = await chrome.storage.sync.get(null);
        const noteKeys = Object.keys(allNotes);

        if (noteKeys.length === 0) {
            alert('Không có ghi chú nào để xuất.');
            return;
        }

        const blob = new Blob([JSON.stringify(allNotes, null, 2)], { 
            type: 'application/json;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ghi_chu_ho_so_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    importJsonBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                const confirmation = confirm('Nhập dữ liệu sẽ GHI ĐÈ lên các ghi chú hiện tại có cùng mã hồ sơ. Tiếp tục?');
                if (confirmation) {
                    await chrome.storage.sync.set(data);
                    alert('Đã nhập thành công!');
                    await renderAllNotes();
                    await updateStorageUsage();
                }
            } catch (error) {
                alert('Lỗi khi đọc file JSON. Vui lòng kiểm tra file.');
                console.error('Import error:', error);
            }
        };
        input.click();
    });

    deleteAllBtn.addEventListener('click', async () => {
        const confirmation = confirm('BẠN CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ GHI CHÚ KHÔNG?\n\nHành động này không thể hoàn tác và sẽ xóa vĩnh viễn tất cả ghi chú đã lưu trên tài khoản Google của bạn.');
        
        if (confirmation) {
            await chrome.storage.sync.clear();
            alert('Đã xóa thành công toàn bộ ghi chú.');
            await renderAllNotes();
            await updateStorageUsage();
        }
    });

    async function main() {
        if (loadingMessage) loadingMessage.remove();
        await updateStorageUsage();
        await renderAllNotes();
    }

    main();
});