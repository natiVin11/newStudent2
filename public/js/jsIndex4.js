document.addEventListener("DOMContentLoaded", () => {
    const categoriesContainer = document.getElementById("category-buttons");
    const learningListContainer = document.getElementById("learning-list");
    const learningContentContainer = document.getElementById("learning-content");
    const loadingErrorContainer = document.getElementById("loading-error");
    const issuesSection = document.getElementById("issues-section");
    const categorySelect = document.getElementById("category-select");
    const issueSelect = document.getElementById("issue-select");
    const solutionTextElement = document.getElementById("solution-text");
    const technicianMessageElement = document.getElementById("technician-message");
    const sendTechnicianMessageButton = document.getElementById("send-technician-message");

    let allIssues = []; // שמירת כל התקלות
    let currentIssues = []; // שמירת התקלות המוצגות כעת

    // --- Reusable Fetch Helper ---
    async function fetchData(apiUrl) {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                let errorMsg = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) { /* Ignore if response is not JSON */ }
                throw new Error(errorMsg);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching data from ${apiUrl}:`, error);
            if (loadingErrorContainer) {
                loadingErrorContainer.textContent = `Failed to load data: ${error.message}. Please try again later.`;
                loadingErrorContainer.style.display = 'block';
            }
            throw error;
        }
    }
    // --- End Fetch Helper ---

    // --- Issues Section Functions ---
    async function loadAllIssues() {
        try {
            allIssues = await fetchData("/api/issues");
            const categories = [...new Set(allIssues.map(issue => issue.category))].filter(Boolean);

            categorySelect.innerHTML = '<option value="">בחר קטגוריה</option>';
            categories.forEach(category => {
                const option = document.createElement("option");
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading all issues and categories:", error);
            categorySelect.innerHTML = '<option value="">שגיאה בטעינת קטגוריות</option>';
        }
    }

    function loadIssuesByCategory() {
        const selectedCategory = categorySelect.value;
        issueSelect.innerHTML = '<option value="">בחר תקלה</option>';
        solutionTextElement.textContent = '';
        currentIssues = [];

        if (selectedCategory) {
            currentIssues = allIssues.filter(issue => issue.category === selectedCategory);
            currentIssues.forEach(issue => {
                const option = document.createElement("option");
                option.value = issue.id;
                option.textContent = issue.issue;
                issueSelect.appendChild(option);
            });
        }
    }

    async function showSolution() {
        const selectedIssueId = issueSelect.value;
        solutionTextElement.textContent = '';

        if (selectedIssueId) {
            const selectedIssue = currentIssues.find(issue => issue.id === parseInt(selectedIssueId));
            if (selectedIssue) {
                solutionTextElement.textContent = selectedIssue.solution;
            }
        }
    }

    function markAsSolved(solved) {
        const selectedIssueId = issueSelect.value;
        const selectedIssue = currentIssues.find(issue => issue.id === parseInt(selectedIssueId));

        if (selectedIssue) {
            selectedIssue.solved = solved; // הוספת מאפיין 'solved' לאובייקט התקלה
            const selectedIssueText = issueSelect.options[issueSelect.selectedIndex]?.textContent;
            technicianMessageElement.innerHTML = solved ?
                `<p>סומן כנפתר עבור: ${selectedIssueText}</p>` :
                `<p>סומן כלא נפתר עבור: ${selectedIssueText}.</p>`;
        }

        // בדיקה אם כל התקלות סומנו כ"לא נפתר"
        const allUnsolved = currentIssues.every(issue => issue.solved === false);
        sendTechnicianMessageButton.style.display = allUnsolved && currentIssues.length > 0 ? 'block' : 'none';
    }

    async function handleSearchIssues() {
        const username = document.getElementById("username").value;
        const department = document.getElementById("department").value;
        const computerName = document.getElementById("computer-name").value;

        if (username && department && computerName) {
            technicianMessageElement.innerHTML = `<p>בודק תקלות עבור משתמש: ${username}, מחלקה: ${department}, מחשב: ${computerName}...</p>`;
            issuesSection.style.display = 'block'; // הצגת סעיף התקלות
            await loadAllIssues(); // טעינת כל התקלות וקטגוריות
            sendTechnicianMessageButton.style.display = 'none'; // הסתרת כפתור השליחה עד לבדיקה
        } else {
            alert("אנא מלאו את כל פרטי המשתמש והמחשב.");
        }
    }

    function sendMessageToTechnician() {
        const username = document.getElementById("username").value;
        const department = document.getElementById("department").value;
        const computerName = document.getElementById("computer-name").value;

        alert(`שליחת הודעה לכונן עבור משתמש: ${username}, מחלקה: ${department}, מחשב: ${computerName}. פרטים נוספים: כל התקלות לא נפתרו.`);
        // כאן תוכל להוסיף קוד אמיתי לשליחת הודעה (למשל, דרך API)
    }
    // --- End Issues Section Functions ---

    // --- Learning Section Functions ---
    async function initializeLearningSection() {
        if (loadingErrorContainer) loadingErrorContainer.style.display = 'none';

        try {
            const lessonsData = await fetchData("/api/lessons");

            if (!lessonsData || lessonsData.length === 0) {
                categoriesContainer.innerHTML = "<p>No learning materials available.</p>";
                learningListContainer.innerHTML = "";
                learningContentContainer.innerHTML = "";
                return;
            }

            createCategoryButtons(lessonsData);

        } catch (error) {
            categoriesContainer.innerHTML = "<p>Could not load categories due to an error.</p>";
            learningListContainer.innerHTML = "";
            learningContentContainer.innerHTML = "";
        }
    }

    function createCategoryButtons(lessonsData) {
        categoriesContainer.innerHTML = "";

        const categories = [...new Set(lessonsData.map(lesson => lesson.category))].filter(Boolean);

        if (categories.length === 0) {
            categoriesContainer.innerHTML = "<p>No categories found.</p>";
            return;
        }

        categories.forEach(category => {
            const button = document.createElement("button");
            button.textContent = category;
            button.onclick = () => displayLearningList(lessonsData, category);
            categoriesContainer.appendChild(button);
        });
    }

    function displayLearningList(lessonsData, category) {
        learningListContainer.innerHTML = "";
        learningContentContainer.innerHTML = "";

        const filteredLessons = lessonsData.filter(lesson => lesson.category === category);

        if (filteredLessons.length === 0) {
            learningListContainer.innerHTML = "<p>No lessons found in this category.</p>";
            return;
        }

        filteredLessons.forEach(lesson => {
            const lessonButton = document.createElement("button");
            lessonButton.textContent = lesson.title;
            lessonButton.onclick = () => displayLessonContent(lesson);
            learningListContainer.appendChild(lessonButton);
        });
    }

    function displayLessonContent(lesson) {
        learningContentContainer.innerHTML = `
            <h2>${lesson.title}</h2>
            <div>${lesson.content}</div> `;
    }
    // --- End Learning Section Functions ---

    // --- Initialize Sections ---
    initializeLearningSection();
});