// js/index2.js

document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('search-box');
    const issuesContainer = document.getElementById('issues-container');
    const issueModal = document.getElementById('issue-modal');
    const newIssueInput = document.getElementById('new-issue');
    const newSolutionInput = document.getElementById('new-solution');

    let allMalfunctions = []; // לשמור את כל התקלות שנטענו מהשרת

    // פונקציה לפתיחת המודל של הוספת תקלה
    window.openIssueModal = () => {
        issueModal.style.display = 'block';
    };

    // פונקציה לסגירת המודל של הוספת תקלה
    window.closeIssueModal = () => {
        issueModal.style.display = 'none';
        newIssueInput.value = '';
        newSolutionInput.value = '';
    };

    // סגירת המודל בלחיצה מחוץ לו
    window.onclick = (event) => {
        if (event.target === issueModal) {
            closeIssueModal();
        }
    };

    // פונקציה לשליחת תקלה חדשה לשרת
    window.submitIssue = async () => {
        const issue = newIssueInput.value.trim();
        const solution = newSolutionInput.value.trim();

        if (!issue || !solution) {
            alert('אנא מלאו את שני השדות.');
            return;
        }

        const dataToSend = { issue: issue, solution: solution };

        try {
            const response = await fetch('/api/malfunctions', { // שימוש בנקודת הקצה /api/malfunctions
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('תקלה חדשה נוספה:', result);
                alert('התקלה נשלחה בהצלחה!');
                closeIssueModal();
                loadAndDisplayMalfunctions(); // טען מחדש והצג את רשימת התקלות המעודכנת
            } else {
                console.error('שגיאה בשליחת תקלה:', response.status);
                alert('אירעה שגיאה בשליחת התקלה.');
            }
        } catch (error) {
            console.error('שגיאת רשת:', error);
            alert('אירעה שגיאת רשת.');
        }
    };

    // פונקציה להצגת רשימת התקלות
    const displayMalfunctions = (malfunctions) => {
        issuesContainer.innerHTML = '';
        if (malfunctions.length === 0) {
            issuesContainer.innerHTML = '<p>לא נמצאו תקלות.</p>';
            return;
        }
        const ul = document.createElement('ul');
        malfunctions.forEach(malfunctionData => {
            const li = document.createElement('li');
            li.innerHTML = `
                <h3>${malfunctionData.malfunction}</h3>
                <p><strong>פתרון:</strong> ${malfunctionData.fix}</p>
                <p class="date">נוסף בתאריך: ${new Date(malfunctionData.date).toLocaleDateString()}</p>
            `;
            ul.appendChild(li);
        });
        issuesContainer.appendChild(ul);
    };

    // פונקציה לטעינת תקלות מהשרת והצגתן
    const loadAndDisplayMalfunctions = async () => {
        issuesContainer.innerHTML = '<p>טוען תקלות...</p>';
        try {
            const response = await fetch('/api/malfunctions'); // שימוש בנקודת הקצה /api/malfunctions
            if (response.ok) {
                allMalfunctions = await response.json();
                displayMalfunctions(allMalfunctions);
            } else {
                console.error('שגיאה בטעינת תקלות:', response.status);
                issuesContainer.innerHTML = '<p>אירעה שגיאה בטעינת התקלות.</p>';
            }
        } catch (error) {
            console.error('שגיאת רשת:', error);
            issuesContainer.innerHTML = '<p>אירעה שגיאת רשת.</p>';
        }
    };

    // האזנה לשינויים בתיבת החיפוש
    searchBox.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredMalfunctions = allMalfunctions.filter(malfunction =>
            malfunction.malfunction.toLowerCase().includes(searchTerm) ||
            malfunction.fix.toLowerCase().includes(searchTerm)
        );
        displayMalfunctions(filteredMalfunctions);
    });

    // טעינה ראשונית של תקלות בעת טעינת הדף
    loadAndDisplayMalfunctions();
});