document.addEventListener('DOMContentLoaded', () => {
    // --- טיפול בטופס הוספת שאלה ---
    const questionForm = document.getElementById('question-form');
    if (questionForm) {
        questionForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const questionInput = document.getElementById('question');
            const answer1Input = document.getElementById('answer1');
            const answer2Input = document.getElementById('answer2');
            const answer3Input = document.getElementById('answer3');
            const correctAnswerInput = document.getElementById('correct-answer');

            const question = questionInput.value.trim();
            const correctAnswer = correctAnswerInput.value.trim();

            if (question && correctAnswer) {
                fetch('/api/questions', { // נקודת קצה בשרת להוספת שאלה
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ question: question, answer: correctAnswer }), // שולח את השאלה והתשובה הנכונה בלבד
                })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message || 'השאלה נוספה בהצלחה!');
                        questionForm.reset();
                    })
                    .catch(error => {
                        console.error('שגיאה בהוספת שאלה:', error);
                        alert('אירעה שגיאה בהוספת השאלה.');
                    });
            } else {
                alert('אנא מלאו את השאלה והתשובה הנכונה.');
            }
        });
    }

    // --- טעינת תשובות וציונים (אם יש אלמנט להצגה) ---
    const answersListDiv = document.getElementById('answers-list');
    if (answersListDiv) {
        fetch('/api/quiz-results') // נקודת קצה בשרת לקבלת תוצאות מבחנים
            .then(response => response.json())
            .then(results => {
                if (results && results.length > 0) {
                    const ul = document.createElement('ul');
                    results.forEach(result => {
                        const li = document.createElement('li');
                        li.textContent = `שם: ${result.name}, ציון: ${result.score}, תאריך: ${new Date(result.date).toLocaleDateString()}`;
                        ul.appendChild(li);
                    });
                    answersListDiv.appendChild(ul);
                } else {
                    answersListDiv.textContent = 'אין תוצאות מבחנים.';
                }
            })
            .catch(error => {
                console.error('שגיאה בטעינת תשובות:', error);
                answersListDiv.textContent = 'אירעה שגיאה בטעינת התשובות.';
            });
    }

    // --- טיפול בטופס הוספת תקלה ---
    const malfunctionForm = document.getElementById('malfunction-form');
    if (malfunctionForm) {
        malfunctionForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const malfunctionInput = document.getElementById('malfunction');
            const solutionTextInput = document.getElementById('solution-text');

            const malfunction = malfunctionInput.value.trim();
            const fix = solutionTextInput.value.trim();

            if (malfunction && fix) {
                fetch('/api/malfunctions', { // נקודת קצה בשרת להוספת תקלה
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ issue: malfunction, solution: fix }), // שימוש בשמות השדות של השרת
                })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message || 'התקלה נוספה בהצלחה!');
                        malfunctionForm.reset();
                        loadMalfunctions(); // טעינה מחדש של רשימת התקלות
                    })
                    .catch(error => {
                        console.error('שגיאה בהוספת תקלה:', error);
                        alert('אירעה שגיאה בהוספת התקלה.');
                    });
            } else {
                alert('אנא מלאו את שני השדות: תקלה ופתרון.');
            }
        });
    }

    // --- טעינת רשימת תקלות ---
    const malfunctionsListDiv = document.getElementById('malfunctions-list');
    const loadMalfunctions = () => {
        if (malfunctionsListDiv) {
            fetch('/api/malfunctions') // נקודת קצה בשרת לקבלת רשימת תקלות
                .then(response => response.json())
                .then(malfunctions => {
                    malfunctionsListDiv.innerHTML = '';
                    if (malfunctions && malfunctions.length > 0) {
                        const ul = document.createElement('ul');
                        malfunctions.forEach(malfunction => {
                            const li = document.createElement('li');
                            li.innerHTML = `<strong>${malfunction.malfunction}:</strong> ${malfunction.fix} (נוסף בתאריך: ${new Date(malfunction.date).toLocaleDateString()})`;
                            ul.appendChild(li);
                        });
                        malfunctionsListDiv.appendChild(ul);
                    } else {
                        malfunctionsListDiv.textContent = 'אין תקלות רשומות.';
                    }
                })
                .catch(error => {
                    console.error('שגיאה בטעינת תקלות:', error);
                    malfunctionsListDiv.textContent = 'אירעה שגיאה בטעינת התקלות.';
                });
        }
    };
    loadMalfunctions(); // טעינה ראשונית של תקלות

    // --- טיפול בטופס העלאת לומדות ---
    const lomdaForm = document.getElementById('lomda-form');
    if (lomdaForm) {
        lomdaForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const categoryInput = document.getElementById('category');
            const lomdaNameInput = document.getElementById('lomda-name');
            const lomdaTextInput = document.getElementById('lomda-text');

            const category = categoryInput.value.trim();
            const title = lomdaNameInput.value.trim();
            const content = lomdaTextInput.value.trim();

            if (category && title && content) {
                fetch('/api/lessons', { // נקודת קצה בשרת להוספת לומדה
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ category, lessonTitle: title, lessonContent: content }), // שימוש בשמות השדות של השרת
                })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message || 'הלומדה נשלחה בהצלחה!');
                        lomdaForm.reset();
                    })
                    .catch(error => {
                        console.error('שגיאה בשליחת לומדה:', error);
                        alert('אירעה שגיאה בשליחת הלומדה.');
                    });
            } else {
                alert('אנא מלאו את כל השדות של הלומדה.');
            }
        });
    }

    // --- טיפול בטופס הוספת עדכון ---
    const updateForm = document.getElementById('update-form');
    const updatesListDiv = document.getElementById('updates-list');
    if (updateForm) {
        updateForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const updateTitleInput = document.getElementById('update-title');
            const updateTextInput = document.getElementById('update-text');

            const title = updateTitleInput.value.trim();
            const text = updateTextInput.value.trim();

            if (title && text) {
                fetch('/api/updates', { // נקודת קצה בשרת להוספת עדכון
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title, text }),
                })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message || 'העדכון נשלח בהצלחה!');
                        updateForm.reset();
                        loadUpdates(); // טעינה מחדש של רשימת העדכונים
                    })
                    .catch(error => {
                        console.error('שגיאה בשליחת עדכון:', error);
                        alert('אירעה שגיאה בשליחת העדכון.');
                    });
            } else {
                alert('אנא מלאו את כותרת ותוכן העדכון.');
            }
        });
    }

    // --- טעינת רשימת עדכונים ---
    const loadUpdates = () => {
        if (updatesListDiv) {
            fetch('/api/updates') // נקודת קצה בשרת לקבלת רשימת עדכונים
                .then(response => response.json())
                .then(updates => {
                    updatesListDiv.innerHTML = '';
                    if (updates && updates.length > 0) {
                        const ul = document.createElement('ul');
                        updates.forEach(update => {
                            const li = document.createElement('li');
                            li.innerHTML = `<strong>${update.title}:</strong> ${update.text} (פורסם בתאריך: ${new Date(update.date).toLocaleDateString()})`;
                            ul.appendChild(li);
                        });
                        updatesListDiv.appendChild(ul);
                    } else {
                        updatesListDiv.textContent = 'אין עדכונים.';
                    }
                })
                .catch(error => {
                    console.error('שגיאה בטעינת עדכונים:', error);
                    updatesListDiv.textContent = 'אירעה שגיאה בטעינת העדכונים.';
                });
        }
    };
    loadUpdates(); // טעינה ראשונית של עדכונים

    // --- טעינת רשימת עובדים חדשים ---
    const newEmployeesListDiv = document.getElementById('new-employees-list');
    if (newEmployeesListDiv) {
        fetch('/api/students/new-employees') // נקודת קצה בשרת לקבלת רשימת עובדים חדשים
            .then(response => response.json())
            .then(employees => {
                newEmployeesListDiv.innerHTML = '';
                if (employees && employees.length > 0) {
                    const ul = document.createElement('ul');
                    employees.forEach(employee => {
                        const li = document.createElement('li');
                        li.textContent = `שם: ${employee.name}, סטטוס: ${employee.status}, ת"ז: ${employee.id_number}${employee.pdfFilePath ? `, <a href="${employee.pdfFilePath}" target="_blank">טופס משאבי אנוש</a>` : ''}`;
                        ul.appendChild(li);
                    });
                    newEmployeesListDiv.appendChild(ul);
                } else {
                    newEmployeesListDiv.textContent = 'אין עובדים חדשים.';
                }
            })
            .catch(error => {
                console.error('שגיאה בטעינת עובדים חדשים:', error);
                newEmployeesListDiv.textContent = 'אירעה שגיאה בטעינת רשימת העובדים החדשים.';
            });
    }

    // --- טיפול בטופס הוספת בעיה (issueForm) ---
    const issueForm = document.getElementById('issueForm');
    const submitBtn = document.getElementById('submitBtn');
    if (issueForm && submitBtn) {
        submitBtn.addEventListener('click', function() {
            const categoryIssueInput = document.getElementById('category-issue');
            const issueTextInput = document.getElementById('issue-text');
            const solutionTextInputIssue = document.getElementById('solution-text-issue');
            const alternativeSolutionInput = document.getElementById('alternativeSolution');
            const ownerSelect = document.getElementById('owner');

            const category = categoryIssueInput.value.trim();
            const issue = issueTextInput.value.trim();
            const solution = solutionTextInputIssue.value.trim();
            const alternative = alternativeSolutionInput.value.trim();
            const owner = ownerSelect.value;

            if (category && issue && solution && alternative && owner) {
                fetch('/api/issues', { // נקודת קצה בשרת להוספת בעיה (ייתכן שתצטרך נקודת קצה אחרת)
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ category, issue, solution, alternativeSolution: alternative, owner }),
                })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message || 'הבעיה נשלחה בהצלחה!');
                        issueForm.reset();
                    })
                    .catch(error => {
                        console.error('שגיאה בשליחת בעיה:', error);
                        alert('אירעה שגיאה בשליחת הבעיה.');
                    });
            } else {
                alert('אנא מלאו את כל השדות בטופס הבעיה.');
            }
        });
    }
});