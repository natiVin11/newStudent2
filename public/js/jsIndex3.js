document.addEventListener("DOMContentLoaded", () => {
    const categoriesContainer = document.getElementById("category-buttons");
    const learningListContainer = document.getElementById("learning-list");
    const learningContentContainer = document.getElementById("learning-content");

    loadCategories();

    async function loadCategories() {
        try {
            const response = await fetch("/api/categories");
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "שגיאה בטעינת הקטגוריות");
            }
            const categories = await response.json();
            createCategoryButtons(categories);
        } catch (error) {
            console.error("שגיאה בטעינת הקטגוריות:", error);
            categoriesContainer.innerHTML = `<p class="error-message">שגיאה בטעינת הקטגוריות: ${error.message}</p>`;
        }
    }

    function createCategoryButtons(categories) {
        categoriesContainer.innerHTML = ""; // ניקוי קטגוריות קודמות
        categories.forEach(category => {
            const button = document.createElement("button");
            button.textContent = category;
            button.onclick = () => loadLearningList(category);
            categoriesContainer.appendChild(button);
        });
    }

    async function loadLearningList(category) {
        learningListContainer.innerHTML = "טוען...";
        learningContentContainer.innerHTML = ""; // ניקוי התוכן הקודם
        try {
            const response = await fetch(`/api/lessons/${category}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "שגיאה בטעינת רשימת הלומדות");
            }
            const lessons = await response.json();
            displayLearningList(lessons);
        } catch (error) {
            console.error("שגיאה בטעינת רשימת הלומדות:", error);
            learningListContainer.innerHTML = `<p class="error-message">שגיאה בטעינת רשימת הלומדות: ${error.message}</p>`;
        }
    }

    function displayLearningList(lessons) {
        learningListContainer.innerHTML = ""; // ניקוי הרשימה הקודמת
        lessons.forEach(lesson => {
            const lessonButton = document.createElement("button");
            lessonButton.textContent = lesson.lomdaName;
            lessonButton.onclick = () => displayLessonContent(lesson);
            learningListContainer.appendChild(lessonButton);
        });
    }

    function displayLessonContent(lesson) {
        learningContentContainer.innerHTML = `
            <h2>${lesson.lomdaName}</h2>
            <p>${lesson.lomdaText}</p>
        `;
    }
});