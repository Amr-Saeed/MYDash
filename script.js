document.addEventListener("DOMContentLoaded", () => {
    const taskInput = document.getElementById("taskInput");
    const taskDate = document.getElementById("taskDate");
    const addTaskButton = document.querySelector(".addTask");
    const toBeDoneList = document.querySelector(".to-be-done-list");
    const doneList = document.querySelector(".done-list");

    const addNotesButton = document.querySelector(".addNote");
    const noteInput = document.getElementById("addNotes");
    const notesList = document.querySelector(".notes-list");

    const eventTitleInput = document.getElementById("eventTitle");
    const eventDateInput = document.getElementById("eventDate");
    const eventTimeInput = document.getElementById("eventTime"); // Added input for time
    const addEventButton = document.getElementById("addEventButton");
    const eventList = document.getElementById("eventList");

    // Variables for navigation
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    // Load from Local Storage
    loadTasks();
    loadNotes();
    loadEvents();

    // Add Task Functionality
    addTaskButton.addEventListener("click", () => {
        const taskName = taskInput.value.trim();
        const taskDueDate = taskDate.value;
        if (!taskName) return alert("Please enter a task");

        const today = new Date().toISOString().split("T")[0];
        const taskStatus = (taskDueDate === today) ? "today" :
            (taskDueDate && new Date(taskDueDate) < new Date(today)) ? "overdue" : "upcoming";

        const taskData = { id: Date.now(), name: taskName, dueDate: taskDueDate, status: taskStatus };

        if (addTaskButton.textContent === "Update Task") {
            const taskDataToUpdate = { id: taskData.id, name: taskInput.value, dueDate: taskDate.value, status: taskStatus };
            updateTaskInLocalStorage(taskDataToUpdate);
            updateTaskInUI(taskDataToUpdate);
        } else {
            createTaskElement(taskData);
            saveTaskToLocalStorage(taskData);
        }

        taskInput.value = "";
        taskDate.value = "";
        addTaskButton.textContent = "Add Task"; // Reset button text
    });

    // Add Note Functionality
    addNotesButton.addEventListener("click", () => {
        const noteText = noteInput.value.trim();
        if (!noteText) return alert("Please enter a note");

        const noteData = { id: Date.now(), text: noteText }; // Add an ID

        if (addNotesButton.textContent === "Update Note") {
            // Update note
            updateNoteInLocalStorage(noteData);
            updateNoteInUI(noteData);
        } else {
            createNoteElement(noteData);
            saveNoteToLocalStorage(noteData);
        }

        noteInput.value = "";
        addNotesButton.textContent = "Add Note"; // Reset button text
    });

    // Add Event Functionality
    addEventButton.addEventListener("click", () => {
        const title = eventTitleInput.value.trim();
        const date = eventDateInput.value;
        const time = eventTimeInput.value; // Capture the time input
        if (!title || !date || !time) return alert("Please enter an event title, date, and time");

        const eventData = { title, date, time };
        saveEventToLocalStorage(eventData);
        renderEvent(eventData);

        eventTitleInput.value = "";
        eventDateInput.value = "";
        eventTimeInput.value = ""; // Reset time input
    });

    // Calendar Display with Full Calendar
    renderCalendar();

    // Navigation for months
    document.getElementById("nextMonth").addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    document.getElementById("prevMonth").addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    // Make widget boxes draggable
    const draggableWidgets = document.querySelectorAll(".widget-calendar, .widget-tasks, .widget-notes");

    draggableWidgets.forEach((widget) => {
        widget.setAttribute("draggable", true);

        widget.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("text", event.target.id);
        });

        widget.addEventListener("dragover", (event) => {
            event.preventDefault(); // Allow the drop
        });

        widget.addEventListener("drop", (event) => {
            event.preventDefault();
            const draggedWidgetId = event.dataTransfer.getData("text");
            const draggedWidget = document.getElementById(draggedWidgetId);
            const targetWidget = event.target;

            if (targetWidget === draggedWidget) return;

            // Swap the positions of the dragged widget and the target widget
            const parent = draggedWidget.parentNode;
            const target = targetWidget.parentNode;

            parent.insertBefore(draggedWidget, targetWidget);
            target.insertBefore(targetWidget, draggedWidget);
        });
    });

    // Function to create a task element
    function createTaskElement(taskData) {
        const listItem = document.createElement("li");
        listItem.className = "task-item";
        listItem.draggable = true;
        listItem.innerHTML = `${taskData.name} - ${taskData.dueDate || "No due date"}`;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete");
        deleteButton.addEventListener("click", () => {
            listItem.remove();
            deleteTaskFromLocalStorage(taskData);
        });

        const updateButton = document.createElement("button");
        updateButton.textContent = "Update";
        updateButton.classList.add("update");
        updateButton.addEventListener("click", () => {
            taskInput.value = taskData.name;
            taskDate.value = taskData.dueDate;
            addTaskButton.textContent = "Update Task"; // Change button text

            const previousClickListener = addTaskButton.onclick;
            addTaskButton.removeEventListener("click", previousClickListener);
            addTaskButton.addEventListener("click", () => {
                taskData.name = taskInput.value;
                taskData.dueDate = taskDate.value;
                listItem.childNodes[0].textContent = `${taskData.name} - ${taskData.dueDate || "No due date"}`;
                updateTaskInLocalStorage(taskData);
                addTaskButton.textContent = "Add Task"; // Reset button text
                taskInput.value = "";
                taskDate.value = "";
                addTaskButton.removeEventListener("click", arguments.callee); // Remove the update listener
            });
        });

        listItem.appendChild(deleteButton);
        listItem.appendChild(updateButton);

        if (taskData.status === "today" || taskData.status === "overdue") {
            doneList.appendChild(listItem);
        } else {
            toBeDoneList.appendChild(listItem);
        }
    }

    // Function to create a note element
    function createNoteElement(noteData) {
        const listItem = document.createElement("li");
        listItem.textContent = noteData.text;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete");
        deleteButton.addEventListener("click", () => {
            listItem.remove();
            deleteNoteFromLocalStorage(noteData);
        });

        const updateButton = document.createElement("button");
        updateButton.textContent = "Update";
        updateButton.classList.add("update");
        updateButton.addEventListener("click", () => {
            noteInput.value = noteData.text;
            addNotesButton.textContent = "Update Note"; // Change button text

            const previousClickListener = addNotesButton.onclick;
            addNotesButton.removeEventListener("click", previousClickListener);
            addNotesButton.addEventListener("click", () => {
                noteData.text = noteInput.value;
                listItem.childNodes[0].textContent = noteInput.value;
                updateNoteInLocalStorage(noteData);
                addNotesButton.textContent = "Add Note"; // Reset button text
                noteInput.value = "";
                addNotesButton.removeEventListener("click", arguments.callee); // Remove the update listener
            });
        });

        listItem.appendChild(deleteButton);
        listItem.appendChild(updateButton);

        notesList.appendChild(listItem);
    }

    // Save tasks to local storage
    function saveTaskToLocalStorage(taskData) {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks.push(taskData);
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    // Load tasks from local storage
    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks.forEach(task => createTaskElement(task));
    }

    // Delete task from local storage
    function deleteTaskFromLocalStorage(taskData) {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        const updatedTasks = tasks.filter(task => task.name !== taskData.name || task.dueDate !== taskData.dueDate);
        localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    }

    // Update task in local storage
    function updateTaskInLocalStorage(taskData) {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        const taskIndex = tasks.findIndex(task => task.id === taskData.id);
        if (taskIndex > -1) {
            tasks[taskIndex] = taskData;
            localStorage.setItem("tasks", JSON.stringify(tasks));
        }
    }

    // Save notes to local storage
    function saveNoteToLocalStorage(noteData) {
        const notes = JSON.parse(localStorage.getItem("notes")) || [];
        notes.push(noteData);
        localStorage.setItem("notes", JSON.stringify(notes));
    }

    // Load notes from local storage
    function loadNotes() {
        const notes = JSON.parse(localStorage.getItem("notes")) || [];
        notes.forEach(note => createNoteElement(note));
    }

    // Delete note from local storage
    function deleteNoteFromLocalStorage(noteData) {
        const notes = JSON.parse(localStorage.getItem("notes")) || [];
        const updatedNotes = notes.filter(note => note.text !== noteData.text);
        localStorage.setItem("notes", JSON.stringify(updatedNotes));
    }

    // Update note in local storage
    function updateNoteInLocalStorage(noteData) {
        const notes = JSON.parse(localStorage.getItem("notes")) || [];
        const noteIndex = notes.findIndex(note => note.id === noteData.id);
        if (noteIndex > -1) {
            notes[noteIndex] = noteData;
            localStorage.setItem("notes", JSON.stringify(notes));
        }
    }

    // Save event to local storage
    function saveEventToLocalStorage(eventData) {
        const events = JSON.parse(localStorage.getItem("events")) || [];
        events.push(eventData);
        localStorage.setItem("events", JSON.stringify(events));
    }

    // Render event on the calendar
    function renderEvent(eventData) {
        const eventElement = document.createElement("div");
        eventElement.className = "event-item";
        eventElement.innerHTML = `<strong>${eventData.title}</strong> on ${eventData.date} at ${eventData.time}`; // Show time

        // Find the correct day and add a circle
        const calendarDays = document.querySelectorAll(".calendar-day");
        calendarDays.forEach(day => {
            if (day.textContent == new Date(eventData.date).getDate()) {
                const circle = document.createElement("div");
                circle.className = "event-circle";
                day.appendChild(circle);
            }
        });

        // Add event to the upcoming events list
        const listItem = document.createElement("li");
        listItem.textContent = `${eventData.title} on ${eventData.date} at ${eventData.time}`; // Show time
        eventList.appendChild(listItem);
    }

    // Load events from local storage and render them
    function loadEvents() {
        const events = JSON.parse(localStorage.getItem("events")) || [];
        events.forEach(event => renderEvent(event));
    }

    // Render the calendar with days
    function renderCalendar() {
        const calendar = document.getElementById("calendar");
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const monthName = firstDayOfMonth.toLocaleString("default", { month: "long" });

        calendar.innerHTML = `<h3>${monthName} ${currentYear}</h3>`;

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement("div");
            dayDiv.className = "calendar-day";
            dayDiv.textContent = day;
            calendar.appendChild(dayDiv);
        }
    }
});
// Select the draggable elements
const draggableElements = document.querySelectorAll('.widget-container .widget-tasks, .widget-container .widget-notes, .widget-container .widget-calendar');

// Add the necessary event listeners to enable dragging
draggableElements.forEach(item => {
    item.addEventListener('dragstart', dragStart);
    item.addEventListener('dragend', dragEnd);
});

function dragStart(event) {
    // Add a class to indicate the element is being dragged
    event.target.classList.add('dragging');
    // Temporarily hide the element
    setTimeout(() => {
        event.target.style.opacity = '0.5';
    }, 0);
}

function dragEnd(event) {
    // Remove the dragging class
    event.target.classList.remove('dragging');
    event.target.style.opacity = '1';
}

// Allow dropping by preventing the default behavior for dragover
const container = document.querySelector('.widget-container');
container.addEventListener('dragover', dragOver);
container.addEventListener('drop', drop);

function dragOver(event) {
    event.preventDefault();
    const draggingElement = document.querySelector('.dragging');
    const closestElement = getClosestElement(event.clientY);
    if (closestElement) {
        container.insertBefore(draggingElement, closestElement);
    } else {
        container.appendChild(draggingElement);
    }
}

function drop(event) {
    event.preventDefault();
    const draggingElement = document.querySelector('.dragging');
    container.appendChild(draggingElement);
}

// Function to get the closest element to where the user is dragging
function getClosestElement(y) {
    const draggableItems = [...container.querySelectorAll('.widget-tasks, .widget-notes, .widget-calendar')];
    return draggableItems.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
