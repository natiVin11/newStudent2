document.addEventListener('DOMContentLoaded', function() {
    loadIdeas();
});

document.getElementById('new-idea-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const title = document.getElementById('idea-title').value;
    const description = document.getElementById('idea-description').value;

    if (title && description) {
        const newIdea = {
            title: title,
            description: description,
            date: new Date().toLocaleString()
        };

        // שולח את הרעיון לשרת
        fetch('/ideas', { // שינוי מכתובת מלאה לנתיב יחסי
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newIdea)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(error => {
                        throw new Error(error.message || 'שגיאה בשמירת הרעיון בשרת');
                    });
                }
                return response.json();
            })
            .then(data => {
                // נטען מחדש את הרעיונות
                loadIdeas();
                document.getElementById('new-idea-form').reset();
            })
            .catch(error => console.error('שגיאה בהוספת רעיון:', error));
    }
});

function loadIdeas() {
    const ideasContainer = document.getElementById('ideas-container');
    ideasContainer.innerHTML = ''; // ניקוי התצוגה

    // מבצע קריאה לשרת כדי לקבל את כל הרעיונות
    fetch('/ideas') // שינוי מכתובת מלאה לנתיב יחסי
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    throw new Error(error.message || 'שגיאה בטעינת הרעיונות מהשרת');
                });
            }
            return response.json();
        })
        .then(ideas => {
            if (ideas && ideas.length === 0) { // הוספת בדיקה ל-null
                ideasContainer.innerHTML = '<p>אין רעיונות עדיין.</p>';
            } else if (ideas) { // בדיקה נוספת ל-null לפני הלולאה
                ideas.forEach(function(idea) {
                    const ideaElement = document.createElement('div');
                    ideaElement.classList.add('idea-item');
                    ideaElement.innerHTML = `
                        <h3>${idea.title}</h3>
                        <p>${idea.description}</p>
                        <small>נוסף ב: ${idea.date}</small>
                    `;
                    ideasContainer.appendChild(ideaElement);
                });
            } else {
                ideasContainer.innerHTML = '<p>אירעה שגיאה בטעינת הרעיונות.</p>';
            }
        })
        .catch(error => console.error('שגיאה בהבאת הרעיונות:', error));
}