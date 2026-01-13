/* eslint-disable no-console */
// Configuration constants
const API_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';
const API_KEY = 'df3ddd20-e6f4-42a6-a275-d7ac1de8a55f'; 

// Global state variables
let allTutorsData = [];
let coursesData = [];
let filteredCourses = []; 
let currentPage = 1;
const recordsPerPage = 5;

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', () => {
    fetchCourses();
    fetchTutors();
    setMinimumDate();
});

// ------------------------------------------
// COURSES LOGIC
// ------------------------------------------

/**
 * Fetches course data from the API and initializes filtering.
 */
async function fetchCourses() {
    try {
        const response = await fetch(`${API_URL}/courses?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('API Error');
        coursesData = await response.json();
        
        // Initialize filtered list with all courses
        filteredCourses = [...coursesData]; 
        
        // Setup filter listeners
        document.getElementById('search-course-name').addEventListener('input', applyCourseFilters);
        document.getElementById('filter-course-level').addEventListener('change', applyCourseFilters);
        
        renderCourses(1);
    } catch (e) { 
        console.error(e);
        showAlert("Ошибка загрузки курсов", "danger");
    }
}

/**
 * Applies search and level filters to the course list.
 */
function applyCourseFilters() {
    const searchName = document.getElementById('search-course-name').value.toLowerCase().trim();
    const filterLevel = document.getElementById('filter-course-level').value;

    filteredCourses = coursesData.filter(course => {
        const matchesName = course.name.toLowerCase().includes(searchName);
        // Strict comparison for level values from API
        const matchesLevel = filterLevel === "" || course.level === filterLevel;
        return matchesName && matchesLevel;
    });

    // Reset to first page after filtering
    currentPage = 1; 
    renderCourses(1);
}

/**
 * Renders the table of courses for the current page.
 * @param {number} page - The page number to display.
 */
function renderCourses(page) {
    currentPage = page;
    const start = (page - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    
    const paginatedItems = filteredCourses.slice(start, end);
    const tbody = document.getElementById('courses-table-body');
    tbody.innerHTML = '';
    
    if (paginatedItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Курсы не найдены</td></tr>';
    }

    paginatedItems.forEach(course => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${course.name}</td>
            <td>${course.level}</td>
            <td>${course.teacher}</td>
            <td>${course.total_length} нед.</td>
            <td><button class="btn btn-success btn-sm" onclick="openOrderModal(${course.id})">Записаться</button></td>
        `;
        tbody.appendChild(tr);
    });

    renderPagination();
}

/**
 * Renders pagination controls for the course table.
 */
function renderPagination() {
    const totalPages = Math.ceil(filteredCourses.length / recordsPerPage);
    const pagination = document.getElementById('courses-pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    // Prev Button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    prevLi.onclick = (e) => {
        e.preventDefault();
        if (currentPage > 1) renderCourses(currentPage - 1);
    };
    pagination.appendChild(prevLi);

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.onclick = (e) => {
            e.preventDefault();
            renderCourses(i);
        };
        pagination.appendChild(li);
    }

    // Next Button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    nextLi.onclick = (e) => {
        e.preventDefault();
        if (currentPage < totalPages) renderCourses(currentPage + 1);
    };
    pagination.appendChild(nextLi);
}

// ------------------------------------------
// TUTORS LOGIC
// ------------------------------------------

/**
 * Fetches tutor data and initializes tutor list.
 */
async function fetchTutors() {
    try {
        const response = await fetch(`${API_URL}/tutors?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('API Error');
        allTutorsData = await response.json();
        
        // Setup filter listeners
        document.getElementById('filter-tutor-language').addEventListener('change', applyTutorFilters);
        document.getElementById('filter-tutor-exp').addEventListener('input', applyTutorFilters);
        
        renderTutors(allTutorsData);
    } catch (err) {
        console.error(err);
        showAlert("Ошибка загрузки репетиторов", "danger");
    }
}

/**
 * Filters tutors based on language and experience.
 */
function applyTutorFilters() {
    const selectedLang = document.getElementById('filter-tutor-language').value;
    const minExp = parseInt(document.getElementById('filter-tutor-exp').value) || 0;

    const filtered = allTutorsData.filter(tutor => {
        // Check if tutor speaks the selected language (if any)
        const matchesLang = selectedLang === "" || tutor.languages_spoken.includes(selectedLang);
        // Check experience threshold
        const matchesExp = tutor.work_experience >= minExp;
        
        return matchesLang && matchesExp;
    });

    renderTutors(filtered);
}

/**
 * Renders the list of tutor cards.
 * @param {Array} tutors - List of tutor objects.
 */
function renderTutors(tutors) {
    const container = document.getElementById('tutors-container');
    container.innerHTML = '';

    if (tutors.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted"><p>Репетиторы не найдены</p></div>';
        return;
    }

    tutors.forEach(tutor => {
        const div = document.createElement('div');
        div.className = 'col-md-4';
        div.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title text-primary">${tutor.name}</h5>
                    <p class="card-text mb-1"><strong>Опыт:</strong> ${tutor.work_experience} лет</p>
                    <p class="card-text mb-1"><strong>Языки:</strong> ${tutor.languages_spoken.join(', ')}</p>
                    <p class="card-text fs-5 mt-2">${tutor.price_per_hour} ₽/час</p>
                </div>
            </div>`;
        container.appendChild(div);
    });
}

// ------------------------------------------
// ORDER MODAL & UTILS
// ------------------------------------------

/**
 * Sets minimum value for all date inputs to current date + 1 day.
 */
function setMinimumDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateStr = tomorrow.toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(i => i.min = minDateStr);
}

let currentCourse = null;

/**
 * Opens the order modal for a specific course.
 * @param {number} courseId - ID of the selected course.
 */
function openOrderModal(courseId) {
    currentCourse = coursesData.find(c => c.id === courseId);
    if (!currentCourse) return;

    // Reset form fields
    const form = document.getElementById('order-form');
    form.reset();
    
    // Fill course details
    document.getElementById('course-id').value = currentCourse.id;
    document.getElementById('course-name').value = currentCourse.name;
    const totalHours = currentCourse.total_length * currentCourse.week_length;
    document.getElementById('duration').value = totalHours;

    // Initialize calculation
    calculatePrice();

    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
}

/**
 * Calculates total price based on form inputs and course rates.
 */
function calculatePrice() {
    if (!currentCourse) return;

    let price = currentCourse.course_fee_per_hour * (currentCourse.total_length * currentCourse.week_length);
    const persons = parseInt(document.getElementById('persons-count').value) || 1;
    
    // Time-based surcharges
    const timeStart = document.getElementById('start-time').value;
    if (timeStart) {
        const hour = parseInt(timeStart.split(':')[0]);
        if (hour >= 9 && hour <= 12) price += 400;
        else if (hour >= 18 && hour <= 20) price += 1000;
    }

    // Weekend surcharge
    const dateStart = new Date(document.getElementById('start-date').value);
    if (!isNaN(dateStart)) {
        const day = dateStart.getDay();
        if (day === 0 || day === 6) price *= 1.5;
    }

    price *= persons;

    // Additional options
    if (document.getElementById('early-registration').checked) price *= 0.9;
    if (document.getElementById('intensive-course').checked) price *= 1.2;
    if (document.getElementById('supplementary').checked) price += 2000 * persons;
    if (document.getElementById('personalized').checked) price += 1500 * currentCourse.total_length;
    if (document.getElementById('excursions').checked) price *= 1.25;
    
    // Group discount
    if (persons >= 5) price *= 0.85; 

    document.getElementById('total-price').innerText = Math.round(price);
}

// Event listeners for real-time price calculation
document.getElementById('order-form').addEventListener('change', calculatePrice);
document.getElementById('order-form').addEventListener('input', calculatePrice);

/**
 * Handles order form submission via POST request.
 */
document.getElementById('submit-order-btn').addEventListener('click', async () => {
    const form = document.getElementById('order-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = {
        course_id: parseInt(document.getElementById('course-id').value),
        date_start: document.getElementById('start-date').value,
        time_start: document.getElementById('start-time').value,
        persons: parseInt(document.getElementById('persons-count').value),
        price: parseInt(document.getElementById('total-price').innerText),
        early_registration: document.getElementById('early-registration').checked,
        intensive_course: document.getElementById('intensive-course').checked,
        supplementary: document.getElementById('supplementary').checked,
        personalized: document.getElementById('personalized').checked,
        excursions: document.getElementById('excursions').checked,
        assessment: document.getElementById('assessment').checked,
        interactive: document.getElementById('interactive').checked,
        group_enrollment: parseInt(document.getElementById('persons-count').value) >= 5, 
        duration: currentCourse.total_length * currentCourse.week_length
    };

    try {
        const response = await fetch(`${API_URL}/orders?api_key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showAlert('Заявка успешно создана!', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
            modal.hide();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Ошибка создания заявки');
        }
    } catch (error) {
        console.error(error);
        showAlert(error.message, 'danger');
    }
});

/**
 * Displays a temporary alert message to the user.
 * @param {string} message - Text to display.
 * @param {string} type - Bootstrap alert type (success, danger, warning).
 */
function showAlert(message, type) {
    const container = document.getElementById('alerts-container');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible fade show" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('');
    container.append(wrapper);
    
    setTimeout(() => {
        wrapper.remove();
    }, 5000);
}