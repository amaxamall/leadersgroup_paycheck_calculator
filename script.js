// --- Personal Bonus Calculation ---
const personalForm = document.getElementById('personalForm');
const personalResult = document.getElementById('personalResult');
const exportCSVBtn = document.getElementById('exportCSV');
const teamSection = document.getElementById('teamSection');

let personalData = {};
let exportedCSV = "";

// Unit rates
const unitRates = {
    OZ: 100,
    ZH: 71.43,
    Pension: 2.5,
    Loan: 1429,
    EF: 100
};

// Euro per unit by rank
const euroPerUnit = {
    OZ: { MTP: 3, STP: 5, RaM: 7.5, ReM: 10 },
    ZH: { MTP: 3, STP: 5, RaM: 7.5, ReM: 10 },
    Pension: 10,
    Loan: 10,
    EF: 10
};

personalForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const rank = document.getElementById('rank').value;
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    const OZ = parseFloat(document.getElementById('oz').value);
    const ZH = parseFloat(document.getElementById('zh').value);
    const Pension = parseFloat(document.getElementById('pension').value);
    const Loan = parseFloat(document.getElementById('loan').value);
    const EF = parseFloat(document.getElementById('ef').value);

    personalData = { name, rank, month, year, OZ, ZH, Pension, Loan, EF };

    // Units
    const units = {
        OZ: Number((OZ / unitRates.OZ).toFixed(2)),
        ZH: Number((ZH / unitRates.ZH).toFixed(2)),
        Pension: Number((Pension * unitRates.Pension).toFixed(2)),
        Loan: Number((Loan / unitRates.Loan).toFixed(2)),
        EF: Number((EF / unitRates.EF).toFixed(2))
    };

    // Euros
    const euros = {
        OZ: Number((units.OZ * euroPerUnit.OZ[rank]).toFixed(2)),
        ZH: Number((units.ZH * euroPerUnit.ZH[rank]).toFixed(2)),
        Pension: Number((units.Pension * euroPerUnit.Pension).toFixed(2)),
        Loan: Number((units.Loan * euroPerUnit.Loan).toFixed(2)),
        EF: Number((units.EF * euroPerUnit.EF).toFixed(2))
    };

    const total = Number(
        Object.values(euros).reduce((a, b) => a + b, 0).toFixed(2)
    );

    // Show results
    personalResult.innerHTML = `
        <h3>Резултати за ${name} (${rank})</h3>
        <p>Месец/Година: ${month}/${year}</p>
        <p>ОЗ: ${units.OZ} единици → ${euros.OZ} €</p>
        <p>ЖЗ: ${units.ZH} единици → ${euros.ZH} €</p>
        <p>Пенсионно: ${units.Pension} единици → ${euros.Pension} €</p>
        <p>Кредитиране: ${units.Loan} единици → ${euros.Loan} €</p>
        <p>ЕФ: ${units.EF} единици → ${euros.EF} €</p>
        <h4>Общо: ${total.toFixed(2)} €</h4>
    `;

    exportedCSV = `${name},${rank},${month},${year},${units.OZ},${units.ZH},${units.Pension},${units.Loan},${units.EF},${total}\n`;

    // Export / Team visibility
    if (["MTP", "STP", "RaM"].includes(rank)) {
        exportCSVBtn.style.display = "block";
        teamSection.style.display = ["RaM", "ReM"].includes(rank) ? "block" : "none";
    } else {
        exportCSVBtn.style.display = "none";
        teamSection.style.display = "block";
    }
});

// --- Export CSV ---
exportCSVBtn.addEventListener('click', () => {
    const blob = new Blob([exportedCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${personalData.name}_bonus.csv`;
    a.click();
    URL.revokeObjectURL(url);
});

// --- Drag & Drop Multi-file Upload ---
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('teamFile');
const uploadedFilesList = document.getElementById('uploadedFiles');

let uploadedFiles = [];

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
    addFiles(e.target.files);
    fileInput.value = "";
});

dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    addFiles(e.dataTransfer.files);
});

function addFiles(files) {
    for (let i = 0; i < files.length; i++) {
        uploadedFiles.push(files[i]);
    }
    renderFileList();
}

function renderFileList() {
    uploadedFilesList.innerHTML = "";
    uploadedFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.textContent = file.name;

        const removeBtn = document.createElement('span');
        removeBtn.textContent = "×";
        removeBtn.classList.add('removeFile');
        removeBtn.onclick = () => removeFile(index);

        li.appendChild(removeBtn);
        uploadedFilesList.appendChild(li);
    });
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    renderFileList();
}

// --- Team calculation ---
document.getElementById('calcTeam').addEventListener('click', () => {
    if (uploadedFiles.length === 0) {
        alert("Моля, добавете поне един CSV файл.");
        return;
    }

    let allTeamData = [];
    let processed = 0;

    uploadedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            allTeamData = allTeamData.concat(parseCSV(e.target.result));
            processed++;
            if (processed === uploadedFiles.length) {
                displayTeamResults(allTeamData, personalData);
            }
        };
        reader.readAsText(file);
    });
});

// --- CSV Parsing ---
function parseCSV(csvText) {
    return csvText.trim().split("\n").map(line => {
        const p = line.split(",");
        return {
            name: p[0],
            rank: p[1],
            OZ_units: Number(p[4]),
            ZH_units: Number(p[5])
        };
    });
}

// --- Display Team Results ---
function displayTeamResults(allTeamData, personalData) {
    const teamResults = document.getElementById('teamResults');
    let html = `<h3>Бонусно възнаграждение от екипа</h3><ul>`;

    let teamBonusTotal = 0;

    allTeamData.forEach(emp => {
        const bonus = Number((
            emp.OZ_units * euroPerUnit.OZ[personalData.rank] +
            emp.ZH_units * euroPerUnit.ZH[personalData.rank]
        ).toFixed(2));

        teamBonusTotal += bonus;

        html += `<li>${emp.name} (${emp.rank}) → ${bonus.toFixed(2)} €</li>`;
    });

    teamBonusTotal = Number(teamBonusTotal.toFixed(2));

    const personalTotal = Number(personalResult
        .querySelector('h4')
        .innerText.replace(/[^\d.]/g, ''));

    const grandTotal = Number((personalTotal + teamBonusTotal).toFixed(2));

    html += `
        </ul>
        <h4>Бонус от екипа: ${teamBonusTotal.toFixed(2)} €</h4>
        <h2>Общо: ${grandTotal.toFixed(2)} €</h2>
    `;

    teamResults.innerHTML = html;
}
