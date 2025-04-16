async function loadLessons(category) {
    const learningList = document.getElementById("learning-list");
    const errorMessageElement = document.getElementById("error-message");

    learningList.innerHTML = ""; // ניקוי רשימה קודמת
    errorMessageElement.style.display = "none"; // הסתרת הודעת שגיאה לפני טעינה

    try {
        const response = await fetch(`/api/lessons?category=${category}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'שגיאה בטעינת הלומדות');
        }
        const data = await response.json();

        if (data && data.length > 0) {
            // הצגת הלומדות
            data.forEach(lesson => {
                const div = document.createElement("div");
                div.classList.add("lesson-item");
                div.innerHTML = `<h3>${lesson.title}</h3><p>${lesson.description}</p>`;
                div.onclick = () => showLessonContent(lesson.content);
                learningList.appendChild(div);
            });
        } else {
            learningList.innerHTML = "<p>אין לומדות בקטגוריה זו.</p>";
        }

    } catch (error) {
        console.error("Error fetching lessons:", error);
        // הצגת הודעת שגיאה במקרה של בעיה
        errorMessageElement.textContent = `שגיאה בטעינת הלומדות: ${error.message}`;
        errorMessageElement.style.display = "block";
    }
}

function showLessonContent(content) {
    const contentDiv = document.getElementById("learning-content");
    contentDiv.innerHTML = `<p>${content}</p>`;
}