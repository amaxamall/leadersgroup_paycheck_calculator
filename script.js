// ===================== Paycheck Calculator =====================
const personalForm = document.getElementById('personalForm');
const personalResult = document.getElementById('personalResult');
const exportCSVBtn = document.getElementById('exportCSV');
const teamSection = document.getElementById('teamSection');
const resetBtn = document.getElementById('resetCalc');

const ozInput = document.getElementById('oz');
const zhInput = document.getElementById('zh');
const loanInput = document.getElementById('loan');
const efInput = document.getElementById('ef');

[ozInput, zhInput, loanInput, efInput].forEach(attachBGFormatter);

let personalData = {};
let exportedCSV = "";
let uploadedFiles = [];

// ===================== Rates =====================
const unitRates = {
    OZ: 100,
    ZH: 71.43,
    Pension: 2.5,
    Loan: 1429,
    EF: 100
};

const euroPerUnit = {
    OZ: { МТП: 3, СТП: 5, РаМ: 7.5, РеМ: 10 },
    ZH: { МТП: 3, СТП: 5, РаМ: 7.5, РеМ: 10 },
    Pension: 10,
    Loan: 10,
    EF: 10
};

// ===================== Result Calculation =====================
personalForm.addEventListener('submit', e => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const rank = document.getElementById('rank').value;
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;

    const OZ = parseBGNumber(ozInput.value);
    const ZH = parseBGNumber(zhInput.value);
    const Pension = Number(document.getElementById('pension').value);
    const Loan = parseBGNumber(loanInput.value);
    const EF = parseBGNumber(efInput.value);

    const units = {
        OZ: round2(OZ / unitRates.OZ),
        ZH: round2(ZH / unitRates.ZH),
        Pension: round2(Pension * unitRates.Pension),
        Loan: round2(Loan / unitRates.Loan),
        EF: round2(EF / unitRates.EF)
    };

    const euros = {
        OZ: round2(units.OZ * euroPerUnit.OZ[rank]),
        ZH: round2(units.ZH * euroPerUnit.ZH[rank]),
        Pension: round2(units.Pension * euroPerUnit.Pension),
        Loan: round2(units.Loan * euroPerUnit.Loan),
        EF: round2(units.EF * euroPerUnit.EF)
    };

    const personalUnitsTotal = round2(
        units.OZ + units.ZH + units.Pension + units.Loan + units.EF
    );

    const personalTotal = round2(
        Object.values(euros).reduce((a, b) => a + b, 0)
    );

    personalData = { name, rank, month, year, personalUnitsTotal, personalTotal };

    personalResult.innerHTML = `
        <h2>Резултати за ${name} (${rank})</h2>
        <p>Месец/Година: ${month}/${year}</p>
        <p>ОЗ: ${units.OZ} ед. → ${formatBG(euros.OZ)} €</p>
        <p>ЖЗ: ${units.ZH} ед. → ${formatBG(euros.ZH)} €</p>
        <p>Пенсионно: ${units.Pension} ед. → ${formatBG(euros.Pension)} €</p>
        <p>Кредитиране: ${units.Loan} ед. → ${formatBG(euros.Loan)} €</p>
        <p>ЕФ: ${units.EF} ед. → ${formatBG(euros.EF)} €</p>
        <hr>
        <h3>Общо единици: ${personalUnitsTotal}</h3>
        <hr>
        <h2>Възнаграждение: ${formatBG(personalTotal)} €</h2>
    `;

    exportedCSV =
        `${name},${rank},${month},${year},` +
        `${units.OZ},${units.ZH},${units.Pension},${units.Loan},${units.EF},${personalTotal}\n`;

    exportCSVBtn.style.display = rank === "РеМ" ? "none" : "block";
    teamSection.style.display = ["РаМ", "РеМ"].includes(rank) ? "block" : "none";
});

resetBtn.addEventListener('click', () => {
    personalForm.reset();
    personalResult.innerHTML = "";
    exportCSVBtn.style.display = "none";
    teamSection.style.display = "none";
    document.getElementById('teamResults').innerHTML = "";
    document.getElementById('uploadedFiles').innerHTML = "";
    uploadedFiles = [];
    exportedCSV = "";
    personalData = {};
});

// ===================== CSV Export =====================
exportCSVBtn.addEventListener('click', () => {
    const blob = new Blob([exportedCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${personalData.name}_bonus.csv`;
    a.click();
    URL.revokeObjectURL(url);
});

// ===================== Drag & Drop option =====================
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('teamFile');
const uploadedFilesList = document.getElementById('uploadedFiles');

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
    uploadedFiles.push(...e.target.files);
    renderFileList();
    fileInput.value = "";
});

dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    uploadedFiles.push(...e.dataTransfer.files);
    renderFileList();
});

function renderFileList() {
    uploadedFilesList.innerHTML = "";
    uploadedFiles.forEach((file, i) => {
        const li = document.createElement('li');
        li.textContent = file.name;
        const remove = document.createElement('span');
        remove.textContent = "×";
        remove.className = "removeFile";
        remove.onclick = () => {
            uploadedFiles.splice(i, 1);
            renderFileList();
        };
        li.appendChild(remove);
        uploadedFilesList.appendChild(li);
    });
}

// ===================== Bonus Calculation =====================
document.getElementById('calcTeam').addEventListener('click', () => {
    if (!uploadedFiles.length) {
        alert("Моля, добавете поне един CSV файл.");
        return;
    }

    let allTeamData = [];
    let processed = 0;

    uploadedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            allTeamData = allTeamData.concat(parseCSV(e.target.result));
            if (++processed === uploadedFiles.length) {
                displayTeamResults(allTeamData);
            }
        };
        reader.readAsText(file);
    });
});

function parseCSV(text) {
    return text.trim().split('\n').map(line => {
        const p = line.split(',');
        return {
            name: p[0],
            rank: p[1],
            OZ: round2(Number(p[4])),
            ZH: round2(Number(p[5]))
        };
    });
}

// ===================== Bonus Results =====================
function displayTeamResults(data) {
    const teamResults = document.getElementById('teamResults');

    const rankOrder = { МТП: 1, СТП: 2, РаМ: 3 };

    data.sort((a, b) => {
        if (rankOrder[a.rank] !== rankOrder[b.rank]) {
            return rankOrder[a.rank] - rankOrder[b.rank];
        }
        return a.name.localeCompare(b.name, 'bg');
    });

    let html = `<h2>Бонусно възнаграждение от екипа</h2>`;
    let totalTeamUnits = 0;
    let totalTeamBonus = 0;

    data.forEach(emp => {
        const empUnits = round2(emp.OZ + emp.ZH);
        const diffRate =
            euroPerUnit.OZ[personalData.rank] -
            euroPerUnit.OZ[emp.rank];

        const bonus = round2(empUnits * diffRate);

        totalTeamUnits = round2(totalTeamUnits + empUnits);
        totalTeamBonus = round2(totalTeamBonus + bonus);

        html += `
            <p>
                <strong>${emp.name}</strong> (${emp.rank})<br>
                ОЗ: ${emp.OZ} ед. + ЖЗ: ${emp.ZH} ед.
                = ${empUnits} ед.
                → ${formatBG(bonus)} €
            </p>
        `;
    });

    const allUnitsTotal = round2(
        personalData.personalUnitsTotal + totalTeamUnits
    );

    const grandTotal = round2(
        personalData.personalTotal + totalTeamBonus
    );

    html += `
        <hr>
        <h3>Общо единици от екипа: ${totalTeamUnits}</h3>
        <h2>Бонус от екипа: ${formatBG(totalTeamBonus)} €</h2>
        <hr>
        <h3>Общо единици (лични + екип): ${allUnitsTotal}</h3>
        <h2>Общо възнаграждение: ${formatBG(grandTotal)} €</h2>
    `;

    teamResults.innerHTML = html;
}

// ===================== Helpers =====================
function parseBGNumber(value) {
    if (!value) return 0;
    return Number(value.replace(/\s/g, '').replace(',', '.'));
}

function formatBG(value, digits = 2) {
    return Number(value).toLocaleString('bg-BG', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
}

function round2(num) {
    return Number(num.toFixed(2));
}

function attachBGFormatter(input) {
    input.addEventListener('input', () => {
        const raw = input.value.replace(/[^\d.,]/g, '');
        const num = parseBGNumber(raw);
        input.value = raw ? num.toLocaleString('bg-BG') : '';
    });
}
