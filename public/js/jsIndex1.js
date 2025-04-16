document.addEventListener("DOMContentLoaded", function () {
    loadStudents();
    loadUpdates();
});

// Helper function for API calls
async function fetchData(apiUrl) {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (e) { /* Ignore if response is not JSON */ }
            console.error(`Error fetching data from ${apiUrl}: ${errorMsg}`); // Log the detailed error
            throw new Error(errorMsg);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data from ${apiUrl}:`, error);
        throw error;
    }
}

// Fetch students from the server API
async function loadStudents() {
    try {
        const studentsData = await fetchData("/api/students/progress");

        const studentsList = document.getElementById("students");
        if (!studentsList) {
            console.error("Element with ID 'students' not found in the DOM.");
            return;
        }
        studentsList.innerHTML = "";

        if (!studentsData || studentsData.length === 0) {
            studentsList.innerHTML = "<li>No students found.</li>";
            return;
        }

        studentsData.forEach(student => {
            const li = document.createElement("li");
            li.textContent = student.name || 'שם לא זמין';
            li.style.cursor = "pointer";
            li.onclick = () => showStudentCard(student);
            studentsList.appendChild(li);
        });
    } catch (error) {
        console.error("Error loading students:", error);
        const studentsList = document.getElementById("students");
        if (studentsList) {
            studentsList.innerHTML = "<li>Failed to load students. Please try again later.</li>";
        }
    }
}

// Fetch updates from the server API and start animation
async function loadUpdates() {
    try {
        const updates = await fetchData("/api/updates");

        const updateList = document.getElementById("update-list");
        if (!updateList) {
            console.error("Element with ID 'update-list' not found in the DOM.");
            return;
        }
        updateList.innerHTML = "";

        if (!updates || updates.length === 0) {
            updateList.innerHTML = '<div class="update-item"><p>No recent updates.</p></div>';
            return;
        }

        updates.forEach(update => {
            const div = document.createElement("div");
            div.classList.add("update-item");
            div.innerHTML = `<h3>${update.title || 'כותרת לא זמינה'}</h3><p>${update.text || 'עדכון לא זמין'}</p>`;
            updateList.appendChild(div);
        });

        startUpdatesScroll(); // Start animation after updates are loaded

    } catch (error) {
        console.error("Error loading updates:", error);
        const updateList = document.getElementById("update-list");
        if (updateList) {
            updateList.innerHTML = '<div class="update-item"><p>Failed to load updates.</p></div>';
        }
    }
}

// Function to display the student card modal
function showStudentCard(student) {
    closeStudentCard(); // Close any existing modal first

    const modal = document.createElement("div");
    modal.classList.add("modal");

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn" onclick="closeStudentCard()">×</span>
            <h2>${student?.name || 'N/A'}</h2>
            <p><strong>ID Number:</strong> ${student?.id_number || 'N/A'}</p>
            <p><strong>Phone:</strong> ${student?.phone || 'N/A'}</p>
            <p><strong>Email:</strong> ${student?.email ? `<a href="mailto:${student.email}">${student.email}</a>` : 'N/A'}</p>
            <p><strong>Department:</strong> ${student?.department || 'N/A'}</p>
            <p><strong>Current Step:</strong> ${student?.step || 'N/A'}</p>
            ${student?.file_path ? `<p><strong>HR Form:</strong> <a href="/uploads/${student.file_path}" target="_blank">View File</a></p>` : ''}
            ${student?.progress_date ? `<p><strong>Last Progress:</strong> ${new Date(student.progress_date).toLocaleString()}</p>` : ''}
        </div>
    `;

    document.body.appendChild(modal);
}

// Function to close the student card modal
function closeStudentCard() {
    const modal = document.querySelector(".modal");
    if (modal) {
        modal.remove();
    }
}

// Function to start the scrolling animation for updates
function startUpdatesScroll() {
    const updateList = document.getElementById("update-list");
    if (!updateList) return;

    let scrollAmount = 0;
    if (updateList.scrollIntervalId) {
        clearInterval(updateList.scrollIntervalId);
    }

    updateList.scrollIntervalId = setInterval(() => {
        if (!document.contains(updateList) || updateList.scrollHeight <= updateList.clientHeight) {
            if(updateList.scrollIntervalId) clearInterval(updateList.scrollIntervalId);
            return;
        }

        scrollAmount += 1;
        updateList.scrollTop = scrollAmount;

        if (scrollAmount >= updateList.scrollHeight - updateList.clientHeight) {
            scrollAmount = 0;
            updateList.scrollTop = 0;
        }
    }, 50);
}
