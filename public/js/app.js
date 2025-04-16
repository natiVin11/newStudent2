let newStudent = {
    "name": "",
    "idNumber": "",
    "birthDate": "",
    "securityQuestion": "",
    "answer": "",
    "email": "",
    "address": "",
    "jobTitle": "",
    "department": "",
    "hireDate": "",
    "phoneNumber": "",
    "emergencyContact": "",
    "bankAccount": "",
    "healthInsurance": "",
    "humanResourcesForm": ""
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('step1-search').style.display = 'block'; // הצג את החיפוש
    document.getElementById('step1-details').style.display = 'none'; // הסתר את פרטי המילוי בהתחלה
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    updateProgressBar(1);
    saveProgress(1); // עדכן שלב ראשוני בשרת (אם רוצים)
});

async function searchUser() {
    const searchTerm = document.getElementById('searchTerm').value.trim();

    if (!searchTerm) {
        alert('יש להזין שם עובד או תעודת זהות לחיפוש.');
        return;
    }

    try {
        const response = await fetch(`/api/find-student?searchTerm=${searchTerm}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.found) {
            alert('המשתמש נמצא: ' + data.student.name);
            Object.assign(newStudent, data.student);
            document.getElementById('step1-search').style.display = 'none';
            document.getElementById('step1-details').style.display = 'block'; // הצג את טופס הפרטים (שלב 1)
            document.getElementById('name').value = newStudent.name || '';
            document.getElementById('idNumber').value = newStudent.idNumber || '';
            document.getElementById('birthDate').value = newStudent.birthDate || '';
            document.getElementById('securityQuestion').value = newStudent.securityQuestion || '';
            document.getElementById('answer').value = newStudent.answer || '';
            document.getElementById('email').value = newStudent.email || '';
            document.getElementById('address').value = newStudent.address || '';
            document.getElementById('employeeName').textContent = 'שם העובד: ' + newStudent.name;
            document.getElementById('employeeId').textContent = 'תעודת זהות: ' + newStudent.idNumber;
            updateProgressBar(1); // עדיין בשלב 1, רק מצאנו משתמש קיים
            saveProgress(1);
        } else {
            alert('לא נמצא עובד. אנא מלא את הפרטים.');
            document.getElementById('step1-search').style.display = 'none';
            document.getElementById('step1-details').style.display = 'block'; // הצג את טופס הפרטים (שלב 1) למילוי חדש
            updateProgressBar(1);
            saveProgress(1);
            // איפוס שדות הטופס אם לא נמצא משתמש
            document.getElementById('name').value = '';
            document.getElementById('idNumber').value = '';
            document.getElementById('birthDate').value = '';
            document.getElementById('securityQuestion').value = '';
            document.getElementById('answer').value = '';
            document.getElementById('email').value = '';
            document.getElementById('address').value = '';
        }
    } catch (error) {
        console.error('Error searching for user:', error);
        alert('שגיאה בחיפוש המשתמש.');
    }
}

function updateProgressBar(step) {
    const steps = document.querySelectorAll('.step');
    steps.forEach((stepElem, index) => {
        stepElem.classList.remove('active', 'completed');
        if (index + 1 < step) stepElem.classList.add('completed');
        else if (index + 1 === step) stepElem.classList.add('active');
    });
}

async function saveProgress(step) {
    if (newStudent.idNumber) {
        try {
            const response = await fetch('/api/update-student-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idNumber: newStudent.idNumber, step: step })
            });
            if (!response.ok) {
                console.error('Failed to update progress on server:', response.status);
            }
            const responseData = await response.json();
            console.log('Progress updated on server:', responseData);
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    } else if (step === 1 && document.getElementById('step1-details').style.display === 'block' && document.getElementById('name').value && document.getElementById('idNumber').value) {
        // אם הגענו לשלב מילוי הפרטים וזה השלב הראשון, נשמור את הפרטים הראשוניים
        const name = document.getElementById('name').value;
        const idNumber = document.getElementById('idNumber').value;
        const birthDate = document.getElementById('birthDate').value;
        const securityQuestion = document.getElementById('securityQuestion').value;
        const answer = document.getElementById('answer').value;
        const email = document.getElementById('email').value;
        const address = document.getElementById('address').value;
        const studentData = { name, idNumber, birthDate, securityQuestion, answer, email, address, step };
        await saveStudentDataToServer(studentData, step + 1); // שמירה ראשונית וקידום לשלב הבא
    } else if (step === 1) {
        console.log('בשלב החיפוש או לפני מילוי הפרטים הראשוניים.');
    } else if (newStudent.idNumber) {
        // עדכון התקדמות לשלבים מתקדמים יותר
        try {
            const response = await fetch('/api/update-student-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idNumber: newStudent.idNumber, step: step })
            });
            if (!response.ok) {
                console.error('Failed to update progress on server:', response.status);
            }
            const responseData = await response.json();
            console.log('Progress updated on server:', responseData);
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }
}

async function saveStudentDataToServer(studentData, nextStep) {
    try {
        const response = await fetch('/api/save-student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const responseData = await response.json();
        console.log('Student data saved/updated:', responseData);
        Object.assign(newStudent, studentData); // עדכון newStudent עם הנתונים שנשמרו/עודכנו
        updateProgressBar(nextStep);
        saveProgress(nextStep); // עדכון שלב לאחר שמירה/עדכון
        document.getElementById('step1-details').style.display = 'none';
        document.getElementById('step1').style.display = 'block';
        document.getElementById('employeeName').textContent = 'שם העובד: ' + newStudent.name;
        document.getElementById('employeeId').textContent = 'תעודת זהות: ' + newStudent.idNumber;
        if (nextStep > 1) {
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
        }
    } catch (error) {
        console.error('Error saving/updating student data:', error);
        alert('שמירת/עדכון פרטי העובד נכשלה.');
    }
}

async function uploadHumanResourcesForm() {
    const fileInput = document.getElementById('humanResourcesForm');
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', newStudent.name);
        formData.append('idNumber', newStudent.idNumber);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const responseData = await response.json();
            newStudent.humanResourcesForm = responseData.filePath;
            document.getElementById('uploadedImage').innerHTML = `<img src="${responseData.filePath}" alt="טופס משאבי אנוש שהועלה" style="max-width: 300px;">`;
            document.getElementById('step2').style.display = 'none';
            document.getElementById('step3').style.display = 'block';
            updateProgressBar(3);
            saveProgress(3);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('העלאת הטופס נכשלה.');
        }
    } else {
        alert('יש לבחור ולהעלות את טופס משאבי אנוש.');
    }
}

function completeStep(step) {
    if (step === 1 && document.getElementById('step1-details').style.display === 'block') {
        const name = document.getElementById('name').value;
        const idNumber = document.getElementById('idNumber').value;
        const birthDate = document.getElementById('birthDate').value;
        const securityQuestion = document.getElementById('securityQuestion').value;
        const answer = document.getElementById('answer').value;
        const email = document.getElementById('email').value;
        const address = document.getElementById('address').value;

        if (!name || !idNumber) {
            alert('יש למלא שם ותעודת זהות.');
            return;
        }

        const studentData = { name, idNumber, birthDate, securityQuestion, answer, email, address, step };
        saveStudentDataToServer(studentData, 2);
    } else if (step === 2) {
        uploadHumanResourcesForm();
    } else {
        updateProgressBar(step + 1);
        saveProgress(step + 1);
        document.getElementById(`step${step}`).style.display = 'none';
        document.getElementById(`step${step + 1}`).style.display = 'block';
    }
}

function getFileExtension(filename) {
    return '.' + filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

// הצגה ראשונית של שלב החיפוש
document.getElementById('progressBar').style.display = 'block';
updateProgressBar(1);