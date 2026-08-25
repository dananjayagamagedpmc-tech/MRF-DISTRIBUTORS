// --- Database Initialization (Dexie.js) ---
const db = new Dexie("TyreNetworkDB");
db.version(2).stores({
    distributors: '++id, &accountNumber, name, region, contactNumber, status',
    targets: '++id, accountNumber, period, targetQty, achievedQty, allowancePercentage, status',
    salesLog: '++id, accountNumber, date, invoiceNumber, quantity, brand, size'
});

// --- App State & Core Logic ---
const app = {
    currentView: 'dashboard',
    
    init: async function() {
        this.settings.load();
        this.switchView('dashboard');
        
        // Setup Event Listeners for Live Previews
        document.getElementById('setting-font-size').addEventListener('input', (e) => {
            document.getElementById('font-size-display').innerText = `${e.target.value}px`;
            document.documentElement.style.setProperty('--sys-text-size', `${e.target.value}px`);
        });
        document.getElementById('setting-font-family').addEventListener('change', (e) => {
            document.documentElement.style.setProperty('--sys-font', e.target.value);
        });
        document.getElementById('setting-pos-name').addEventListener('input', (e) => {
             document.getElementById('pos-name-display').innerText = e.target.value || 'Main POS System';
        });
        
        // Set default allowance month to current month
        document.getElementById('allowance-month').value = new Date().toISOString().slice(0, 7);
    },

    // --- Navigation Logic ---
    switchView: function(viewId) {
        document.querySelectorAll('.app-view').forEach(view => view.classList.add('hidden'));
        document.getElementById(`view-${viewId}`).classList.remove('hidden');
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if(link.getAttribute('data-target') === viewId) link.classList.add('active');
        });
        this.currentView = viewId;

        if (viewId === 'dashboard') this.updateDashboardMetrics();
        if (viewId === 'distributors') this.renderDistributors();
        if (viewId === 'targets') this.renderTargets();
        if (viewId === 'allowance') this.renderAllowances();
        if (viewId === 'analytics') this.renderAnalytics();
        if (viewId === 'reports') this.renderReportsView();
    },

    // --- Settings Module (Expanded) ---
    settings: {
        config: {
            posName: 'Main POS System',
            themeColor: 'blue',
            themeHex: '#2563eb',
            fontFamily: "'Inter', sans-serif",
            fontSize: '16',
            distributors_showContact: false,
            target_defaultQty: 500,
            target_scaleOrange: 25,
            target_scaleYellow: 50,
            target_scaleGreen: 75,
            target_cardsPerRow: 3,
            allowance_threshold: 80,
            tabName_dashboard: 'Dashboard',
            tabName_distributors: 'Distributors',
            tabName_targets: 'Targets & Sales',
            tabName_allowance: 'Rep Allowance',
            tabName_analytics: 'Analytics',
            tabName_reports: 'Reports'
        },
        
        load: function() {
            const saved = JSON.parse(localStorage.getItem('tddms_settings')) || this.config;
            this.config = { ...this.config, ...saved }; // Merge
            
            // Apply General Settings
            const posNameDisplay = document.getElementById('pos-name-display');
            if (posNameDisplay) {
                posNameDisplay.innerText = this.config.posName;
                posNameDisplay.className = 'hidden';
            }
            document.getElementById('setting-pos-name').value = this.config.posName;
            document.documentElement.style.setProperty('--sys-font', this.config.fontFamily);
            document.getElementById('setting-font-family').value = this.config.fontFamily;
            document.documentElement.style.setProperty('--sys-text-size', `${this.config.fontSize}px`);
            document.getElementById('setting-font-size').value = this.config.fontSize;
            document.getElementById('font-size-display').innerText = `${this.config.fontSize}px`;
            this.setThemeColor(this.config.themeColor, this.config.themeHex, false);

            // Apply Tab Names
            const tabs = ['dashboard', 'distributors', 'targets', 'allowance', 'analytics', 'reports'];
            tabs.forEach(tab => {
                const name = this.config[`tabName_${tab}`];
                if (document.getElementById(`nav-label-${tab}`)) document.getElementById(`nav-label-${tab}`).innerText = name;
                if (document.getElementById(`setting-tab-name-${tab}`)) document.getElementById(`setting-tab-name-${tab}`).value = name;
            });

            // Apply Tab-Specific Settings
            if(document.getElementById('setting-dist-show-contact')) document.getElementById('setting-dist-show-contact').checked = this.config.distributors_showContact;
            if(document.getElementById('setting-target-default')) document.getElementById('setting-target-default').value = this.config.target_defaultQty || 500;
            if(document.getElementById('setting-scale-orange')) document.getElementById('setting-scale-orange').value = this.config.target_scaleOrange || 25;
            if(document.getElementById('setting-scale-yellow')) document.getElementById('setting-scale-yellow').value = this.config.target_scaleYellow || 50;
            if(document.getElementById('setting-scale-green')) document.getElementById('setting-scale-green').value = this.config.target_scaleGreen || 75;
            if(document.getElementById('setting-cards-per-row')) document.getElementById('setting-cards-per-row').value = this.config.target_cardsPerRow || 3;
            if(document.getElementById('setting-allowance-threshold')) document.getElementById('setting-allowance-threshold').value = this.config.allowance_threshold || 80;
            document.getElementById('display-allowance-threshold').innerText = `${this.config.allowance_threshold}%`;
            
            this.applyTabRules();
        },

        applyTabRules: function() {
             // Handle Distributor Contact Column visibility
             const style = document.getElementById('dynamic-styles') || document.createElement('style');
             style.id = 'dynamic-styles';
             style.innerHTML = this.config.dist_hideContact ? `.col-contact, .cell-contact { display: none !important; }` : ``;
             document.head.appendChild(style);
        },
        
        setThemeColor: function(colorName, hexCode, updateDOMDataset = true) {
            document.documentElement.style.setProperty('--sys-primary-color', hexCode);
            document.documentElement.style.setProperty('--sys-primary-dark', this.adjustColor(hexCode, -20));
            document.documentElement.style.setProperty('--sys-primary-light', this.adjustColor(hexCode, 40));
            
            document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('ring-brand'));
            const activeBtn = document.querySelector(`.theme-btn[data-color="${colorName}"]`);
            if (activeBtn) activeBtn.classList.add('ring-brand');
            
            if (updateDOMDataset) {
                document.getElementById('view-settings').dataset.currentColor = colorName;
                document.getElementById('view-settings').dataset.currentHex = hexCode;
            }
        },
        
        saveSettings: function() {
            this.config.posName = document.getElementById('setting-pos-name').value || 'Main POS System';
            this.config.fontFamily = document.getElementById('setting-font-family').value;
            this.config.fontSize = document.getElementById('setting-font-size').value;
            
            if (document.getElementById('view-settings').dataset.currentColor) {
                this.config.themeColor = document.getElementById('view-settings').dataset.currentColor;
                this.config.themeHex = document.getElementById('view-settings').dataset.currentHex;
            }

            // Tab Names
            const tabs = ['dashboard', 'distributors', 'targets', 'allowance', 'analytics', 'reports'];
            tabs.forEach(tab => {
                this.config[`tabName_${tab}`] = document.getElementById(`setting-tab-name-${tab}`).value || this.config[`tabName_${tab}`];
            });

            // Tab specific
            if(document.getElementById('setting-dist-show-contact')) this.config.distributors_showContact = document.getElementById('setting-dist-show-contact').checked;
            if(document.getElementById('setting-target-default')) this.config.target_defaultQty = parseInt(document.getElementById('setting-target-default').value) || 500;
            if(document.getElementById('setting-scale-orange')) this.config.target_scaleOrange = parseInt(document.getElementById('setting-scale-orange').value) || 25;
            if(document.getElementById('setting-scale-yellow')) this.config.target_scaleYellow = parseInt(document.getElementById('setting-scale-yellow').value) || 50;
            if(document.getElementById('setting-scale-green')) this.config.target_scaleGreen = parseInt(document.getElementById('setting-scale-green').value) || 75;
            if(document.getElementById('setting-cards-per-row')) this.config.target_cardsPerRow = parseInt(document.getElementById('setting-cards-per-row').value) || 3;
            if(document.getElementById('setting-allowance-threshold')) this.config.allowance_threshold = parseInt(document.getElementById('setting-allowance-threshold').value) || 80;

            localStorage.setItem('tddms_settings', JSON.stringify(this.config));
            this.load(); // Re-apply
            
            Swal.fire({ icon: 'success', title: 'Settings Saved', text: 'All tab configurations applied.', timer: 1500, showConfirmButton: false });
        },

        adjustColor: function(color, amount) {
            return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
        }
    },

    // --- UI Helpers ---
    ui: {
        switchSettingTab: async function(tabId) {
            document.querySelectorAll('.setting-tab-content').forEach(el => el.classList.add('hidden'));
            document.getElementById(`setting-tab-${tabId}`).classList.remove('hidden');
            document.getElementById(`setting-tab-${tabId}`).classList.add('block');
            
            document.querySelectorAll('.setting-tab-btn').forEach(btn => {
                btn.classList.remove('bg-slate-100', 'text-brand', 'active');
                btn.classList.add('text-slate-600');
            });
            const activeBtn = document.querySelector(`.setting-tab-btn[data-tab="${tabId}"]`);
            activeBtn.classList.remove('text-slate-600');
            activeBtn.classList.add('bg-slate-100', 'text-brand', 'active');

            // Populate specific target distributors dropdown
            if (tabId === 'targets-settings') {
                const select = document.getElementById('setting-specific-distributor');
                const distributors = await db.distributors.toArray();
                select.innerHTML = '<option value="">Select Distributor...</option>' + 
                    distributors.map(d => `<option value="${d.accountNumber}">${d.name} (${d.accountNumber})</option>`).join('');
                document.getElementById('setting-specific-month').value = new Date().toISOString().slice(0, 7);
            }
            
            // Populate manual allowance distributors dropdown
            if (tabId === 'allowance-settings') {
                const select = document.getElementById('setting-allowance-distributor');
                const distributors = await db.distributors.toArray();
                select.innerHTML = '<option value="">Select Distributor...</option>' + 
                    distributors.map(d => `<option value="${d.accountNumber}">${d.name} (${d.accountNumber})</option>`).join('');
                document.getElementById('setting-allowance-month').value = new Date().toISOString().slice(0, 7);
            }
        },
        toggleAllowanceRemark: function() {
            const status = document.getElementById('setting-allowance-status').value;
            const container = document.getElementById('allowance-remark-container');
            const saveBtnContainer = document.getElementById('allowance-save-btn-container');
            
            if (status === 'Pending') {
                container.classList.remove('hidden');
                saveBtnContainer.classList.add('hidden'); // Hide the standalone button
            } else {
                container.classList.add('hidden');
                saveBtnContainer.classList.remove('hidden'); // Show standalone button
                document.getElementById('setting-allowance-remark').value = '';
            }
        },
        openDistributorModal: function() {
            document.getElementById('form-distributor').reset();
            document.getElementById('distributor-id').value = '';
            document.getElementById('modal-distributor-title').innerText = 'Add New Distributor';
            document.getElementById('dist-account').readOnly = false;
            document.getElementById('modal-distributor').classList.remove('hidden');
        },
        closeModal: function(modalId) { document.getElementById(modalId).classList.add('hidden'); },
        openTargetModal: async function() {
            const select = document.getElementById('target-distributor');
            const distributors = await db.distributors.toArray();
            select.innerHTML = '<option value="">Select Distributor...</option>' + 
                distributors.map(d => `<option value="${d.accountNumber}">${d.name} (${d.accountNumber})</option>`).join('');
            document.getElementById('form-target').reset();
            document.getElementById('target-month').value = new Date().toISOString().slice(0, 7);
            document.getElementById('modal-target').classList.remove('hidden');
        },
        openSaleModal: async function() {
            const select = document.getElementById('sale-distributor');
            const distributors = await db.distributors.toArray();
            select.innerHTML = '<option value="">Select Distributor...</option>' + 
                distributors.map(d => `<option value="${d.accountNumber}">${d.name} (${d.accountNumber})</option>`).join('');
            document.getElementById('form-sale').reset();
            document.getElementById('sale-date').value = new Date().toISOString().slice(0, 10);
            document.getElementById('sale-2w').value = 0;
            document.getElementById('sale-3w').value = 0;
            document.getElementById('sale-qty').value = 0;
            document.getElementById('modal-sale').classList.remove('hidden');
        }
    },

    // --- Bulk Excel Import ---
    importExcel: function(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        Swal.fire({
            title: 'Processing...',
            text: 'Please wait while the Excel file is processed.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                if (type === 'distributors') {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheet = workbook.SheetNames[0];
                    const excelRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
                    
                    if (excelRows.length === 0) throw new Error("Empty file.");
                    let addedCount = 0;
                    
                    for (let row of excelRows) {
                        const acc = row['Account Number'] || row['AccountNo'] || row['ID'];
                        const name = row['Name'] || row['Business Name'];
                        
                        if (acc && name) {
                            const exists = await db.distributors.where('accountNumber').equals(acc.toString()).count();
                            if (exists === 0) {
                                await db.distributors.add({
                                    accountNumber: acc.toString(),
                                    name: name,
                                    region: row['Region'] || 'Unassigned',
                                    contactNumber: row['Contact'] || row['Phone'] || '',
                                    status: 'Active'
                                });
                                addedCount++;
                            }
                        }
                    }
                    this.renderDistributors();
                    Swal.fire('Success', `Successfully imported ${addedCount} distributors.`, 'success');
                    this.updateDashboardMetrics();
                } else if (type === 'sales') {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1, defval: ''});

                    let monthRowIdx = 1; 
                    let subHeaderRowIdx = 2; 
                    
                    for (let i = 0; i < 10 && i < rows.length; i++) {
                        if (rows[i].some(cell => String(cell).toUpperCase().includes('SALES QTY') || String(cell).toUpperCase().includes('SALES ACHIEVEMENT'))) {
                            monthRowIdx = i;
                            subHeaderRowIdx = i + 1;
                            break;
                        }
                    }

                    let accColIdx = -1;
                    for (let r = 0; r < Math.min(rows.length, 5); r++) {
                        for (let c = 0; c < rows[r].length; c++) {
                            const cell = String(rows[r][c]).toLowerCase();
                            if (cell.includes('account') || cell.includes('acc') || cell.includes('distributor code')) {
                                accColIdx = c;
                                break;
                            }
                        }
                        if (accColIdx !== -1) break;
                    }
                    
                    if (accColIdx === -1) {
                        throw new Error("Could not find an 'Account' column in the Excel file. Please ensure a column is labeled 'Account', 'Acc', or 'Distributor Code'.");
                    }

                    const targetCols = []; 
                    
                    let lastMonthStr = '';
                    for (let j = 0; j < rows[monthRowIdx].length; j++) {
                        // Get month cell; if empty, use the last non‑empty month (merged cells)
                        const rawMonthCell = String(rows[monthRowIdx][j]).trim();
                        if (rawMonthCell) lastMonthStr = rawMonthCell;
                        const monthCell = lastMonthStr.toUpperCase();
                        let curMonth = null;
                        if (monthCell && (monthCell.includes('SALES QTY') || monthCell.includes('ACHIEVEMENT') || monthCell.match(/(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{4}/))) {
                            const dateStr = monthCell.replace('SALES QTY', '').replace('-', '').trim();
                            const dateObj = new Date(dateStr);
                            if (!isNaN(dateObj.getTime())) {
                                curMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                            }
                        }
                        if (curMonth) {
                            const subCell = String(rows[subHeaderRowIdx][j]).trim().toLowerCase();
                            // Skip 2W/3W columns
                            if (subCell.includes('2w') || subCell.includes('3w')) continue;
                            // Accept only "Total" columns that are not target totals
                            if (subCell.includes('total') && !subCell.includes('target')) {
                                targetCols.push({ month: curMonth, colIdx: j });
                            }
                        }
                    }

                    if (targetCols.length === 0) {
                        throw new Error("Could not find any 'Total' columns for the specified months. Ensure headers like 'SALES QTY - MAY 2026' exist and have a 'Total' sub-column.");
                    }

                    let processedCount = 0;
                    let notFoundCount = 0;
                    const allTargets = await db.targets.toArray();
                    
                    for (let i = subHeaderRowIdx + 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || row.length === 0) continue;
                        
                        const accNo = String(row[accColIdx]).trim();
                        if (!accNo) continue;
                        
                        const dist = await db.distributors.where('accountNumber').equals(accNo).first();
                        if (!dist) {
                            notFoundCount++;
                            continue;
                        }

                        for (const tCol of targetCols) {
                            const rawVal = row[tCol.colIdx];
                            let achieved = parseFloat(rawVal);
                            if (isNaN(achieved) || achieved === 0) continue;

                            // 1. Log sale (for dashboard)
                            await db.salesLog.add({
                                accountNumber: accNo,
                                date: `${tCol.month}-01`, // Default to 1st of month for bulk
                                invoiceNumber: 'BULK',
                                quantity: achieved,
                                brand: 'Bulk Upload',
                                size: ''
                            });

                            // 2. Update Targets
                            const existingTarget = allTargets.find(t => t.accountNumber === accNo && t.period === tCol.month);
                            if (existingTarget) {
                                await db.targets.update(existingTarget.id, { achievedQty: existingTarget.achievedQty + achieved });
                                existingTarget.achievedQty += achieved;
                            } else {
                                const newTarget = {
                                    accountNumber: accNo,
                                    period: tCol.month,
                                    targetQty: app.settings.config.target_defaultQty || 500,
                                    achievedQty: achieved,
                                    createdAt: new Date().toISOString()
                                };
                                const newId = await db.targets.add(newTarget);
                                newTarget.id = newId;
                                allTargets.push(newTarget);
                            }
                            processedCount++;
                        }
                    }
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Upload Complete',
                        html: `Processed sales for <b>${targetCols.length}</b> months.<br>Added <b>${processedCount}</b> sales logs.<br>${notFoundCount > 0 ? `Could not find <b>${notFoundCount}</b> account numbers.` : ''}`,
                    });
                    
                    if (this.currentView === 'targets') this.renderTargets(); 
                    if (this.currentView === 'dashboard') this.filterDashboardSales();
                    this.updateDashboardMetrics();
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Error', err.message || 'Failed to parse Excel file', 'error');
            }
            event.target.value = '';
        };
        
        if (type === 'distributors') {
            reader.readAsBinaryString(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    },

    // --- Specific Target Logic ---
    setSpecificTarget: async function() {
        const acc = document.getElementById('setting-specific-distributor').value;
        const period = document.getElementById('setting-specific-month').value;
        const qty = parseInt(document.getElementById('setting-specific-target-qty').value);

        if (!acc || !period || isNaN(qty) || qty < 0) {
            Swal.fire('Validation Error', 'Please select a distributor, month, and enter a valid quantity.', 'warning');
            return;
        }

        try {
            let target = await db.targets.where({ accountNumber: acc, period: period }).first();
            if (target) {
                target.targetQty = qty;
                await db.targets.put(target);
            } else {
                await db.targets.add({
                    accountNumber: acc,
                    period: period,
                    targetQty: qty,
                    achievedQty: 0,
                    allowancePercentage: 0,
                    status: 'Pending'
                });
            }
            
            Swal.fire('Target Saved', `Target of ${qty} saved for ${acc} in ${period}.`, 'success');
            
            // Clear inputs
            document.getElementById('setting-specific-distributor').value = '';
            document.getElementById('setting-specific-target-qty').value = '';
            
            if (this.currentView === 'targets' || this.currentView === 'allowance') {
                this.renderTargets();
                this.renderAllowances();
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to save specific target.', 'error');
        }
    },
    
    // --- Manual Allowance Status Logic ---
    saveAllowanceStatus: async function() {
        const acc = document.getElementById('setting-allowance-distributor').value;
        const period = document.getElementById('setting-allowance-month').value;
        const status = document.getElementById('setting-allowance-status').value;
        const remark = document.getElementById('setting-allowance-remark').value.trim();

        if (!acc || !period || !status) {
            Swal.fire('Validation Error', 'Please select a distributor, month, and status.', 'warning');
            return;
        }

        try {
            let target = await db.targets.where({ accountNumber: acc, period: period }).first();
            if (target) {
                target.status = status;
                target.allowanceRemark = remark;
                await db.targets.put(target);
            } else {
                await db.targets.add({
                    accountNumber: acc,
                    period: period,
                    targetQty: this.settings.config.target_defaultQty,
                    achievedQty: 0,
                    allowancePercentage: 0,
                    status: status,
                    allowanceRemark: remark
                });
            }
            
            Swal.fire('Status Saved', `Allowance status updated to ${status} for ${acc}.`, 'success');
            
            if (this.currentView === 'allowance') {
                this.renderAllowances();
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to save allowance status.', 'error');
        }
    },

    // --- Render Functions ---
    renderDistributors: async function() {
        const tbody = document.getElementById('distributors-table-body');
        const distributors = await db.distributors.toArray();
        if (distributors.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-500">No distributors found. Upload Excel or Add New.</td></tr>`;
            return;
        }
        tbody.innerHTML = distributors.map(d => `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="p-4 font-mono text-sm text-slate-700">${d.accountNumber}</td>
                <td class="p-4 font-medium text-slate-800 font-sinhala-fallback">${d.name}</td>
                <td class="p-4 text-slate-600">${d.region}</td>
                <td class="p-4 text-slate-600 cell-contact">${d.contactNumber || '-'}</td>
                <td class="p-4"><span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">${d.status}</span></td>
                <td class="p-4 text-right">
                     <button onclick="app.deleteDistributor(${d.id})" class="text-red-500 hover:text-red-700 p-2 ml-1" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    },
    
    renderAllowances: async function() {
        const period = document.getElementById('allowance-month').value;
        const tbody = document.getElementById('allowance-table-body');
        const threshold = this.settings.config.allowance_threshold;
        
        const distributors = await db.distributors.toArray();
        if (distributors.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-500">No distributors available.</td></tr>`;
            return;
        }

        // Performance Fix: Fetch all targets for the period at once instead of inside the loop
        const targetsArray = await db.targets.toArray();
        const targetsForPeriod = targetsArray.filter(t => t.period === period);
        const targetMap = {};
        for(let i=0; i<targetsForPeriod.length; i++){
            targetMap[targetsForPeriod[i].accountNumber] = targetsForPeriod[i];
        }

        let html = '';
        for (const dist of distributors) {
            // Get target from memory map (O(1)) instead of DB query
            const target = targetMap[dist.accountNumber];
            
            const targetQty = target ? target.targetQty : this.settings.config.target_defaultQty;
            const achievedQty = target ? target.achievedQty : 0;
            const percentage = targetQty > 0 ? ((achievedQty / targetQty) * 100).toFixed(1) : 0;
            
            // Read status from DB, default to Pending if not eligible yet. 
            // If they are over threshold, but no manual status was set, default to Pending.
            let currentStatus = target ? target.status : 'Pending';
            let remark = target && target.allowanceRemark ? target.allowanceRemark : '';
            
            // If user hasn't hit threshold and status is still 'Pending', we might want to auto-flag as Not Eligible visually
            if (percentage < threshold && currentStatus === 'Pending') {
                currentStatus = 'Not Eligible';
            }

            let statusBadge = '';
            if (currentStatus === 'Processed') {
                statusBadge = `<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold block w-fit"><i class="fa-solid fa-check-circle mr-1"></i> Paid</span>`;
            } else if (currentStatus === 'Pending') {
                statusBadge = `<span class="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold block w-fit"><i class="fa-solid fa-clock mr-1"></i> Pending</span>`;
            } else {
                statusBadge = `<span class="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold block w-fit"><i class="fa-solid fa-xmark mr-1"></i> Not Eligible</span>`;
            }
            
            if (remark) {
                statusBadge += `<p class="text-[10px] text-slate-400 mt-1 ml-1 truncate max-w-[120px]" title="${remark}"><i class="fa-solid fa-comment-dots mr-1"></i>${remark}</p>`;
            }

            html += `
                <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td class="p-4 font-mono text-sm text-slate-700">${dist.accountNumber}</td>
                    <td class="p-4 font-medium text-slate-800 font-sinhala-fallback">${dist.name}</td>
                    <td class="p-4 text-slate-600">${targetQty}</td>
                    <td class="p-4 font-semibold text-slate-800">${achievedQty}</td>
                    <td class="p-4">
                        <div class="flex items-center space-x-2">
                            <div class="w-full bg-slate-200 rounded-full h-2">
                                <div class="bg-brand h-2 rounded-full" style="width: ${Math.min(percentage, 100)}%"></div>
                            </div>
                            <span class="text-xs font-medium text-slate-600 w-10 text-right">${percentage}%</span>
                        </div>
                    </td>
                    <td class="p-4">${statusBadge}</td>
                </tr>
            `;
        }
        tbody.innerHTML = html;
    },

    renderReportsView: async function() {
        const select = document.getElementById('report-distributor');
        if (!select) return;
        const distributors = await db.distributors.toArray();
        const currentSelection = select.value;
        select.innerHTML = '<option value="all">All Distributors</option>' + 
            distributors.map(d => `<option value="${d.accountNumber}">${d.name} (${d.accountNumber})</option>`).join('');
        if (currentSelection) select.value = currentSelection;
    },

    applyExcelStyles: function(ws, jsonData) {
        if (!ws || !ws['!ref']) return;
        const range = XLSX.utils.decode_range(ws['!ref']);
        
        // 1. Calculate and set column widths
        if (jsonData && jsonData.length > 0) {
            const keys = Object.keys(jsonData[0]);
            const cols = keys.map(key => {
                let max = key.length;
                jsonData.forEach(row => {
                    const val = row[key];
                    if (val !== undefined && val !== null) {
                        const len = String(val).length;
                        if (len > max) max = len;
                    }
                });
                return { wch: max + 4 }; // Add padding
            });
            ws['!cols'] = cols;
        }

        // 2. Style headers (first row)
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
            if (!ws[cellAddress]) continue;
            ws[cellAddress].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "2563EB" } }, // Brand Blue color
                alignment: { horizontal: "center", vertical: "center" }
            };
        }
        
        // 3. Add simple borders to all cells
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cellAddress]) continue;
                if (!ws[cellAddress].s) ws[cellAddress].s = {};
                ws[cellAddress].s.border = {
                    top: { style: "thin", color: { auto: 1 } },
                    bottom: { style: "thin", color: { auto: 1 } },
                    left: { style: "thin", color: { auto: 1 } },
                    right: { style: "thin", color: { auto: 1 } }
                };
            }
        }
    },

    generateExcelReport: async function() {
        try {
            Swal.fire({
                title: 'Generating Report...',
                text: 'Please wait while the Excel file is generated.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const selectedAcc = document.getElementById('report-distributor').value;
            
            let distributors = await db.distributors.toArray();
            let targets = await db.targets.toArray();
            let sales = await db.salesLog.toArray();
            
            if (selectedAcc !== 'all') {
                distributors = distributors.filter(d => d.accountNumber === selectedAcc);
                targets = targets.filter(t => t.accountNumber === selectedAcc);
                sales = sales.filter(s => s.accountNumber === selectedAcc);
            }
            
            const wb = XLSX.utils.book_new();
            
            // 1. Distributors Sheet
            const distData = distributors.map(d => ({
                'Account Number': d.accountNumber,
                'Name': d.name,
                'Region': d.region,
                'Contact': d.contactNumber,
                'Status': d.status
            }));
            const distSheetData = distData.length ? distData : [{'Info': 'No data'}];
            const distSheet = XLSX.utils.json_to_sheet(distSheetData);
            this.applyExcelStyles(distSheet, distSheetData);
            XLSX.utils.book_append_sheet(wb, distSheet, "Distributors");
            
            // 2. Targets Sheet
            const targetData = targets.map(t => ({
                'Account Number': t.accountNumber,
                'Period': t.period,
                'Target Qty': t.targetQty,
                'Achieved Qty': t.achievedQty,
                'Status': t.status,
                'Remark': t.allowanceRemark || ''
            }));
            const targetSheetData = targetData.length ? targetData : [{'Info': 'No data'}];
            const targetSheet = XLSX.utils.json_to_sheet(targetSheetData);
            this.applyExcelStyles(targetSheet, targetSheetData);
            XLSX.utils.book_append_sheet(wb, targetSheet, "Targets & Allowances");
            
            // 3. Sales Sheet
            const saleData = sales.map(s => ({
                'Account Number': s.accountNumber,
                'Date': s.date,
                'Invoice Number': s.invoiceNumber,
                'Brand': s.brand || '',
                'Size': s.size || '',
                'Quantity': s.quantity
            }));
            const saleSheetData = saleData.length ? saleData : [{'Info': 'No data'}];
            const saleSheet = XLSX.utils.json_to_sheet(saleSheetData);
            this.applyExcelStyles(saleSheet, saleSheetData);
            XLSX.utils.book_append_sheet(wb, saleSheet, "Sales");

            const fileName = selectedAcc === 'all' ? 'All_Distributors_Report.xlsx' : `Distributor_Report_${selectedAcc}.xlsx`;
            XLSX.writeFile(wb, fileName);

            Swal.fire({ icon: 'success', title: 'Success', text: 'Report generated successfully.', timer: 1500, showConfirmButton: false });
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to generate report.', 'error');
        }
    },

    updateDashboardMetrics: async function() {
        const count = await db.distributors.count();
        document.getElementById('metric-distributors').innerText = count;
        
        // Populate Dashboard Sales Cards
        // Dropdown removed, filterDashboardSales will render the cards instead
        
        this.filterDashboardSales();

        // Calculate Pending Allowances (Action Items across all periods)
        const targets = await db.targets.toArray();
        const threshold = this.settings.config.allowance_threshold || 80;
        let pendingCount = 0;

        for (const target of targets) {
            const percentage = target.targetQty > 0 ? ((target.achievedQty / target.targetQty) * 100) : 0;
            if (percentage >= threshold && target.status === 'Pending') {
                pendingCount++;
            }
        }
        
        const metricAllowancesEl = document.getElementById('metric-allowances');
        if (metricAllowancesEl) {
            metricAllowancesEl.innerText = pendingCount;
        }
    },
    
    viewPendingAllowances: async function() {
        const targets = await db.targets.toArray();
        const distributors = await db.distributors.toArray();
        const distMap = {};
        distributors.forEach(d => distMap[d.accountNumber] = d.name);

        const threshold = this.settings.config.allowance_threshold || 80;
        const pendingTargets = targets.filter(target => {
            const percentage = target.targetQty > 0 ? ((target.achievedQty / target.targetQty) * 100) : 0;
            return percentage >= threshold && target.status === 'Pending';
        });

        if (pendingTargets.length === 0) {
            Swal.fire('No Pending Allowances', 'All allowances have been approved or threshold not met.', 'info');
            return;
        }

        let html = '<div class="text-left overflow-y-auto max-h-96">';
        pendingTargets.forEach(t => {
            const name = distMap[t.accountNumber] || t.accountNumber;
            const percentage = ((t.achievedQty / t.targetQty) * 100).toFixed(1);
            html += `
                <div class="border-b border-slate-100 py-3 flex justify-between items-center">
                    <div>
                        <div class="font-semibold text-slate-800">${name}</div>
                        <div class="text-xs text-slate-400">Period: ${t.period}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-medium text-slate-700">${t.achievedQty} / ${t.targetQty}</div>
                        <div class="text-xs font-bold text-amber-600">${percentage}%</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        Swal.fire({
            title: 'Pending Allowances',
            html: html,
            icon: 'info',
            confirmButtonColor: app.settings.config.themeHex,
            width: '500px',
            customClass: {
                title: 'text-lg font-semibold',
                htmlContainer: 'mt-4'
            }
        });
    },
    
    filterDashboardSales: async function() {
        const period = new Date().toISOString().slice(0, 7); // Current month
        
        const allSales = await db.salesLog.toArray();
        const thisMonthSales = allSales.filter(s => s.date.startsWith(period));
        
        const grandTotal = thisMonthSales.reduce((sum, sale) => sum + sale.quantity, 0);
        const overallEl = document.getElementById('metric-sales-overall');
        if (overallEl) overallEl.innerText = grandTotal;
        
        // Group sales by distributor
        const distSalesMap = {};
        thisMonthSales.forEach(s => {
            if (!distSalesMap[s.accountNumber]) distSalesMap[s.accountNumber] = 0;
            distSalesMap[s.accountNumber] += s.quantity;
        });

        const distributors = await db.distributors.toArray();
        const cardsContainer = document.getElementById('distributor-sales-cards');
        if (cardsContainer) {
            if (distributors.length === 0) {
                cardsContainer.innerHTML = '<p class="text-slate-500 text-sm col-span-full">No distributors found. Add distributors to see sales cards.</p>';
                return;
            }
            
            let html = '';
            distributors.forEach(dist => {
                const totalSales = distSalesMap[dist.accountNumber] || 0;
                html += `
                    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div class="flex items-center space-x-3">
                            <div class="rounded-full bg-emerald-50 w-10 h-10 flex items-center justify-center text-emerald-500"><i class="fa-solid fa-store"></i></div>
                            <div>
                                <h5 class="text-sm font-bold text-slate-700 max-w-[120px] truncate" title="${dist.name}">${dist.name}</h5>
                                <p class="text-xs text-slate-400">${dist.accountNumber}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="text-lg font-bold text-emerald-600">${totalSales}</span>
                        </div>
                    </div>
                `;
            });
            cardsContainer.innerHTML = html;
        }
    },

    // --- Search and Misc ---
    _searchTimeout: null,
    handleGlobalSearch: function(query) {
        // Performance Fix: Debounce search to prevent lagging while typing
        if (this._searchTimeout) clearTimeout(this._searchTimeout);
        this._searchTimeout = setTimeout(async () => {
            const resultsDiv = document.getElementById('search-results');
            if (!query || query.length < 2) { resultsDiv.classList.add('hidden'); return; }
            const q = query.toLowerCase();
            const all = await db.distributors.toArray();
            const results = all.filter(d => d.accountNumber.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)).slice(0,5);
            if (results.length > 0) {
                resultsDiv.innerHTML = results.map(d => `<div class="p-3 border-b hover:bg-slate-50 cursor-pointer text-sm font-sinhala-fallback">${d.name} (${d.accountNumber})</div>`).join('');
                resultsDiv.classList.remove('hidden');
            } else {
                resultsDiv.innerHTML = `<div class="p-4 text-sm text-slate-500 text-center">No results</div>`;
                resultsDiv.classList.remove('hidden');
            }
        }, 300); // Wait 300ms after last keystroke
    },

    renderTargets: async function() {
        const period = document.getElementById('filter-period-targets').value || new Date().toISOString().slice(0, 7);
        const container = document.getElementById('targets-list');
        const monthDisplay = document.getElementById('targets-month-display').querySelector('span');
        
        // Format Period for Display (e.g. 2026-07 -> July 2026)
        const [year, month] = period.split('-');
        const dateObj = new Date(year, month - 1);
        const monthName = dateObj.toLocaleString('default', { month: 'long' });
        monthDisplay.innerText = `${monthName} ${year}`;
        
        const distributors = await db.distributors.toArray();
        if (distributors.length === 0) {
            container.innerHTML = `<p class="text-sm text-slate-500 text-center py-8">No distributors available. Please add some first.</p>`;
            return;
        }

        const targetsArray = await db.targets.where('period').equals(period).toArray();
        const targetMap = {};
        targetsArray.forEach(t => targetMap[t.accountNumber] = t);

        const cols = this.settings.config.target_cardsPerRow || 3;
        let colClass = 'xl:grid-cols-3';
        if (cols == 1) colClass = 'xl:grid-cols-1';
        if (cols == 2) colClass = 'xl:grid-cols-2';
        if (cols == 3) colClass = 'xl:grid-cols-3';
        if (cols == 4) colClass = 'xl:grid-cols-4';

        let html = `<div class="grid grid-cols-1 md:grid-cols-2 ${colClass} gap-6">`;
        
        distributors.forEach(dist => {
            const target = targetMap[dist.accountNumber];
            const targetQty = target ? target.targetQty : this.settings.config.target_defaultQty;
            const achievedQty = target ? target.achievedQty : 0;
            const percentage = targetQty > 0 ? parseFloat(((achievedQty / targetQty) * 100).toFixed(1)) : 0;
            
            let progressColor = '';
            let badgeHtml = '';
            
            const scaleGreen = this.settings.config.target_scaleGreen || 75;
            const scaleYellow = this.settings.config.target_scaleYellow || 50;
            const scaleOrange = this.settings.config.target_scaleOrange || 25;
            
            if (percentage >= 100) {
                progressColor = 'bg-emerald-500';
                badgeHtml = '<div class="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm tracking-wider">TARGET HIT <i class="fa-solid fa-check ml-1"></i></div>';
            } else if (percentage >= scaleGreen) {
                progressColor = 'bg-emerald-400';
            } else if (percentage >= scaleYellow) {
                progressColor = 'bg-yellow-400';
            } else if (percentage >= scaleOrange) {
                progressColor = 'bg-orange-400';
            } else {
                progressColor = 'bg-rose-400';
            }

            html += `
                <div class="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                    ${badgeHtml}
                    <div class="flex items-start mb-4 bg-blue-50/50 border border-blue-100 p-3 rounded-lg shadow-sm">
                        <div class="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-500 mr-3 shrink-0 border border-blue-100">
                            <i class="fa-solid fa-store"></i>
                        </div>
                        <div class="pt-1 flex-1">
                            <h4 class="font-bold text-slate-800 font-sinhala-fallback text-sm line-clamp-1 w-44" title="${dist.name}">${dist.name}</h4>
                            <p class="text-[11px] text-blue-600 font-mono mt-0.5 tracking-wider font-bold">${dist.accountNumber}</p>
                        </div>
                        <button onclick="app.editSalesData('${dist.accountNumber}', '${period}', ${targetQty}, ${achievedQty})" class="text-slate-400 hover:text-brand transition-colors p-1" title="Edit Sales Data">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-center shadow-sm">
                            <p class="text-[10px] text-rose-500 uppercase font-bold tracking-wider mb-0.5">Target</p>
                            <p class="font-black text-rose-700 text-lg">${targetQty}</p>
                        </div>
                        <div class="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg text-center shadow-sm">
                            <p class="text-[10px] text-emerald-600 uppercase font-bold tracking-wider mb-0.5">Achieved</p>
                            <p class="font-black text-emerald-700 text-lg">${achievedQty}</p>
                        </div>
                    </div>
                    
                    <div>
                        <div class="flex justify-between text-xs mb-1.5 px-0.5">
                            <span class="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Progress</span>
                            <span class="font-black ${percentage >= 100 ? 'text-emerald-600' : 'text-slate-800'}">${percentage}%</span>
                        </div>
                        <div class="w-full bg-white/80 rounded-full h-2 shadow-inner overflow-hidden border border-white/50">
                            <div class="${progressColor} h-full rounded-full transition-all duration-1000 ease-out relative" style="width: ${Math.min(percentage, 100)}%">
                                <div class="absolute inset-0 bg-white/20"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    },
    // --- Edit Sales Data (inline via SweetAlert) ---
    editSalesData: async function(accountNumber, period, currentTarget, currentAchieved) {
        const { value: formValues } = await Swal.fire({
            title: 'Edit Sales Data',
            html: `
                <div style="text-align:left;">
                    <p style="font-size:13px;color:#64748b;margin-bottom:12px;">Account: <b>${accountNumber}</b> | Period: <b>${period}</b></p>
                    <label style="font-size:13px;font-weight:600;color:#334155;">Target Qty</label>
                    <input id="swal-target" type="number" min="0" value="${currentTarget}" class="swal2-input" style="margin-bottom:8px;">
                    <label style="font-size:13px;font-weight:600;color:#334155;">Achieved Qty (Total Sales)</label>
                    <input id="swal-achieved" type="number" min="0" value="${currentAchieved}" class="swal2-input">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Save Changes',
            confirmButtonColor: '#2563eb',
            preConfirm: () => {
                return {
                    targetQty: parseInt(document.getElementById('swal-target').value) || 0,
                    achievedQty: parseInt(document.getElementById('swal-achieved').value) || 0
                };
            }
        });

        if (formValues) {
            try {
                let target = await db.targets.where({ accountNumber: accountNumber, period: period }).first();
                if (target) {
                    target.targetQty = formValues.targetQty;
                    target.achievedQty = formValues.achievedQty;
                    await db.targets.put(target);
                } else {
                    await db.targets.add({
                        accountNumber: accountNumber,
                        period: period,
                        targetQty: formValues.targetQty,
                        achievedQty: formValues.achievedQty,
                        allowancePercentage: 0,
                        status: 'Pending'
                    });
                }
                Swal.fire({ icon: 'success', title: 'Updated!', text: 'Sales data has been updated.', timer: 1500, showConfirmButton: false });
                this.renderTargets();
                this.updateDashboardMetrics();
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'Failed to update sales data.', 'error');
            }
        }
    },

    // --- Reset Sales Data (never touches distributors) ---
    resetSales: async function() {
        const period = document.getElementById('filter-period-targets').value || new Date().toISOString().slice(0, 7);
        const [year, month] = period.split('-');
        const dateObj = new Date(year, month - 1);
        const monthName = dateObj.toLocaleString('default', { month: 'long' });

        const { value: choice } = await Swal.fire({
            title: 'Reset Sales Data',
            html: `<p style="font-size:14px;color:#475569;">What would you like to reset?</p>
                   <p style="font-size:12px;color:#ef4444;margin-top:8px;"><i class="fa-solid fa-shield"></i> Distributor list will NOT be affected.</p>`,
            icon: 'warning',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: `Reset ${monthName} ${year} Only`,
            denyButtonText: 'Reset ALL Sales Data',
            confirmButtonColor: '#f59e0b',
            denyButtonColor: '#ef4444',
            cancelButtonText: 'Cancel'
        });

        if (choice === true) {
            // Reset selected month only
            const confirm2 = await Swal.fire({
                title: 'Are you sure?',
                text: `This will delete all sales logs and reset achieved qty for ${monthName} ${year}.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Reset Month',
                confirmButtonColor: '#f59e0b'
            });
            if (confirm2.isConfirmed) {
                // Delete salesLog entries for the month
                const allSales = await db.salesLog.toArray();
                const toDelete = allSales.filter(s => s.date && s.date.startsWith(period));
                for (const sale of toDelete) {
                    await db.salesLog.delete(sale.id);
                }
                // Reset achievedQty in targets for the month
                const targets = await db.targets.where('period').equals(period).toArray();
                for (const t of targets) {
                    t.achievedQty = 0;
                    await db.targets.put(t);
                }
                Swal.fire({ icon: 'success', title: 'Month Reset!', text: `Sales data for ${monthName} ${year} has been cleared.`, timer: 2000, showConfirmButton: false });
                this.renderTargets();
                this.updateDashboardMetrics();
            }
        } else if (choice === false) {
            // Deny button = Reset ALL
            const confirm2 = await Swal.fire({
                title: 'Reset ALL Sales Data?',
                text: 'This will delete ALL sales logs and reset ALL achieved quantities. Distributors will NOT be deleted.',
                icon: 'error',
                showCancelButton: true,
                confirmButtonText: 'Yes, Reset Everything',
                confirmButtonColor: '#ef4444'
            });
            if (confirm2.isConfirmed) {
                await db.salesLog.clear();
                const allTargets = await db.targets.toArray();
                for (const t of allTargets) {
                    t.achievedQty = 0;
                    await db.targets.put(t);
                }
                Swal.fire({ icon: 'success', title: 'All Sales Reset!', text: 'All sales data has been cleared. Distributors are safe.', timer: 2000, showConfirmButton: false });
                this.renderTargets();
                this.updateDashboardMetrics();
            }
        }
    },

    renderAnalytics: function() { /* stub */ },
    deleteDistributor: async function(id) { await db.distributors.delete(id); this.renderDistributors(); },
    saveDistributor: async function(e) {
        e.preventDefault();
        await db.distributors.add({
            accountNumber: document.getElementById('dist-account').value.trim(),
            name: document.getElementById('dist-name').value.trim(),
            region: document.getElementById('dist-region').value.trim(),
            contactNumber: document.getElementById('dist-contact').value.trim(),
            status: 'Active'
        });
        this.ui.closeModal('modal-distributor');
        this.renderDistributors();
    },
    
    saveTarget: async function(e) {
        e.preventDefault();
        const acc = document.getElementById('target-distributor').value;
        const period = document.getElementById('target-month').value;
        const qty = parseInt(document.getElementById('target-qty').value);

        try {
            let target = await db.targets.where({ accountNumber: acc, period: period }).first();
            if (target) {
                target.targetQty = qty;
                await db.targets.put(target);
            } else {
                await db.targets.add({
                    accountNumber: acc,
                    period: period,
                    targetQty: qty,
                    achievedQty: 0,
                    allowancePercentage: 0,
                    status: 'Pending'
                });
            }
            this.ui.closeModal('modal-target');
            Swal.fire('Saved', 'Target has been set successfully.', 'success');
            if (this.currentView === 'targets' || this.currentView === 'allowance') {
                this.renderTargets();
                this.renderAllowances();
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to save target.', 'error');
        }
    },
    
    saveSale: async function(e) {
        e.preventDefault();
        const acc = document.getElementById('sale-distributor').value;
        const dateStr = document.getElementById('sale-date').value;
        const qty = parseInt(document.getElementById('sale-qty').value);
        const period = dateStr.slice(0, 7); // YYYY-MM

        try {
            // 1. Log sale
            await db.salesLog.add({
                accountNumber: acc,
                date: dateStr,
                invoiceNumber: document.getElementById('sale-invoice').value.trim(),
                quantity: qty,
                brand: document.getElementById('sale-brand').value.trim(),
                size: document.getElementById('sale-size').value.trim()
            });

            // 2. Update target logic
            let target = await db.targets.where({ accountNumber: acc, period: period }).first();
            if (!target) {
                target = {
                    accountNumber: acc,
                    period: period,
                    targetQty: this.settings.config.target_defaultQty,
                    achievedQty: qty,
                    allowancePercentage: 0,
                    status: 'Pending'
                };
                await db.targets.add(target);
            } else {
                target.achievedQty += qty;
                await db.targets.put(target);
            }

            this.ui.closeModal('modal-sale');
            Swal.fire('Saved', 'Sale has been logged successfully.', 'success');
            if (this.currentView === 'targets' || this.currentView === 'allowance') {
                this.renderTargets();
                this.renderAllowances();
                // Refresh sales cards and overall metrics on dashboard
                this.filterDashboardSales();
                this.updateDashboardMetrics();
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to log sale.', 'error');
        }
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => { app.init(); });
