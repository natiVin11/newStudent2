// js/quiesJs.js

document.addEventListener('DOMContentLoaded', () => {
    const quizContainer = document.getElementById('quiz');
    const submitButton = document.getElementById('submit');
    const loadingDiv = document.getElementById('loading');
    const messageDiv = document.getElementById('message');
    let currentQuestionIndex = 0;
    let questions = [];
    let userAnswers = [];
    const usernameInput = document.getElementById('username');
    const startQuizButton = document.getElementById('start-quiz-button');
    const startQuizArea = document.getElementById('start-quiz-area');
    const quizArea = document.getElementById('quiz-area');

    loadingDiv.style.display = 'none'; // הסתר את הודעת הטעינה בהתחלה
    quizArea.style.display = 'none';   // הסתר את אזור השאלות בהתחלה

    startQuizButton.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        if (username) {
            startQuizArea.style.display = 'none'; // הסתר את אזור התחלת המבחן
            quizArea.style.display = 'block';    // הצג את אזור השאלות
            loadQuestions();
        } else {
            alert('אנא הכנס שם לפני התחלת המבחן.');
        }
    });

    async function loadQuestions() {
        quizContainer.innerHTML = 'טוען שאלות...';
        try {
            const response = await fetch('/api/questions'); // אותה נקודת קצה לשליפת שאלות
            if (!response.ok) {
                console.error('שגיאה בטעינת שאלות:', response.status);
                quizContainer.innerHTML = 'אירעה שגיאה בטעינת השאלות.';
                return;
            }
            questions = await response.json();
            if (questions.length > 0) {
                quizContainer.innerHTML = '';
                submitButton.style.display = 'block';
                displayQuestion();
            } else {
                quizContainer.innerHTML = 'אין שאלות זמינות כרגע.';
            }
        } catch (error) {
            console.error('שגיאת רשת בטעינת שאלות:', error);
            quizContainer.innerHTML = 'אירעה שגיאת רשת.';
        }
    }

    function displayQuestion() {
        console.log('displayQuestion() called');
        console.log('Current question index:', currentQuestionIndex);
        console.log('Total questions:', questions.length);

        if (currentQuestionIndex < questions.length) {
            const questionData = questions[currentQuestionIndex];
            console.log('Displaying question data:', questionData);

            const questionDiv = document.createElement('div');
            questionDiv.classList.add('question');
            questionDiv.innerHTML = `<h3>${currentQuestionIndex + 1}. ${questionData.question}</h3>`;
            console.log('Question div created:', questionDiv);

            const answerInput = document.createElement('input');
            answerInput.type = 'text';
            answerInput.name = `question-${questionData.id}`;
            console.log('Answer input created:', answerInput);

            questionDiv.appendChild(answerInput);
            console.log('Answer input appended to question div');

            quizContainer.appendChild(questionDiv);
            console.log('Question div appended to quiz container');

            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                displayQuestion();
            }
        } else {
            console.log('All questions displayed.');
        }
    }
    submitButton.addEventListener('click', submitQuiz); // שימוש ב-addEventListener

    async function submitQuiz() {
        const username = usernameInput.value; // קבלת השם משדה הקלט
        if (!username) {
            alert('אנא הכנס שם לפני שליחת המבחן.');
            return;
        }

        const answerInputs = quizContainer.querySelectorAll('input[type="text"]');
        userAnswers = Array.from(answerInputs).map(input => input.value.trim());

        if (userAnswers.length !== questions.length) {
            alert('אנא ענה על כל השאלות לפני שליחה.');
            return;
        }

        loadingDiv.style.display = 'block';
        submitButton.style.display = 'none';
        quizContainer.style.display = 'none';
        messageDiv.textContent = '';

        const resultsToSend = {
            name: username,
            answers: userAnswers,
            questions: questions.map(q => ({ id: q.id, answer: q.answer })), // שולחים את התשובה הנכונה מהשרת
        };

        try {
            const response = await fetch('/api/submit-quiz', { // נקודת הקצה הייעודית לשליחת תשובות
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(resultsToSend),
            });

            loadingDiv.style.display = 'none';
            quizContainer.style.display = 'block';

            if (!response.ok) {
                const error = await response.json();
                console.error('שגיאה בשליחת תשובות:', error);
                messageDiv.textContent = `אירעה שגיאה בשליחת התשובות: ${response.statusText}`;
                return;
            }

            const result = await response.json();
            messageDiv.textContent = `תודה ${result.name}! הציון שלך הוא: ${result.score} מתוך ${questions.length}.`;
            if (result.wrongAnswers && result.wrongAnswers.length > 0) {
                const wrongAnswersList = document.createElement('ul');
                wrongAnswersList.textContent = 'תשובות שגויות:';
                result.wrongAnswers.forEach(wrong => {
                    const li = document.createElement('li');
                    li.textContent = `שאלה ${wrong.questionId}: התשובה הנכונה היא "${wrong.correctAnswer}", אתה ענית "${wrong.userAnswer}"`;
                    wrongAnswersList.appendChild(li);
                });
                messageDiv.appendChild(wrongAnswersList);
            }
        } catch (error) {
            console.error('שגיאת רשת בשליחת תשובות:', error);
            messageDiv.textContent = 'אירעה שגיאת רשת בשליחת התשובות.';
        }
    }

    // --- תיקון לשליחת שאלה חדשה ---
    const addQuestionForm = document.getElementById('add-question-form');
    if (addQuestionForm) {
        addQuestionForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const questionInput = document.getElementById('new-question');
            const answerInput = document.getElementById('new-answer');

            const newQuestion = questionInput.value.trim();
            const newAnswer = answerInput.value.trim();

            if (newQuestion && newAnswer) {
                loadingDiv.style.display = 'block';
                try {
                    const response = await fetch('/api/questions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ question: newQuestion, answer: newAnswer }),
                    });

                    loadingDiv.style.display = 'none';
                    if (response.ok) {
                        messageDiv.textContent = 'השאלה נוספה בהצלחה!';
                        questionInput.value = '';
                        answerInput.value = '';
                        // כאן אתה יכול לבחור לטעון מחדש את השאלות אם אתה רוצה שהשינוי יופיע מיידית
                        // loadQuestions();
                    } else {
                        const error = await response.json();
                        console.error('שגיאה בהוספת שאלה:', error);
                        messageDiv.textContent = `אירעה שגיאה בהוספת השאלה: ${response.statusText}`;
                    }
                } catch (error) {
                    console.error('שגיאת רשת בהוספת שאלה:', error);
                    messageDiv.textContent = 'אירעה שגיאת רשת בהוספת השאלה.';
                }
            } else {
                alert('אנא מלא את השאלה והתשובה.');
            }
        });
    }
});