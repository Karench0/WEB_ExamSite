const API_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';
const API_KEY = 'df3ddd20-e6f4-42a6-a275-d7ac1de8a55f'; 

let allTutorsData = [];
let allTutors = []; 
let coursesData = [];
let filteredCourses = []; 
let currentPage = 1;
const recordsPerPage = 5;

document.addEventListener('DOMContentLoaded', () => {
    fetchCourses();
    fetchTutors();
    setMinimumDate();
});

// --- ЛОГИКА КУРСОВ ---

async function fetchCourses() {
    try {
        const response = await fetch(`${API_URL}/courses?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка');
        coursesData = await response.json();
        filteredCourses = [...coursesData]; 
        document.getElementById('search-course-name').addEventListener('input', applyCourseFilters);
        document.getElementById('filter-course-level').addEventListener('change', applyCourseFilters);
        
        renderCourses(1);
    } catch (e) { console.error(e); }
}

function applyCourseFilters() {
    const searchName = document.getElementById('search-course-name').value.toLowerCase();
    const filterLevel = document.getElementById('filter-course-level').value;

    filteredCourses = coursesData.filter(course => {
        const matchesName = course.name.toLowerCase().includes(searchName);
        const matchesLevel = filterLevel === "" || course.level === filterLevel;
        return matchesName && matchesLevel;
    });

    currentPage = 1; 
    renderCourses(1);
}

function renderCourses(page) {
    currentPage = page;
    const start = (page - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    
    const paginatedItems = filteredCourses.slice(start, end);
    const tbody = document.getElementById('courses-table-body');
    tbody.innerHTML = '';
    
    if (paginatedItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Курсы не найдены</td></tr>';
    }

    paginatedItems.forEach(course => {
        tbody.innerHTML += `
            <tr>
                <td>${course.name}</td>
                <td>${course.level}</td>
                <td>${course.teacher}</td>
                <td>${course.total_length} нед.</td>
                <td><button class="btn btn-success btn-sm" onclick="openOrderModal(${course.id})">Записаться</button></td>
            </tr>`;
    });

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredCourses.length / recordsPerPage);
    const pagination = document.getElementById('courses-pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    // Кнопка "Назад" (стрелочка влево)
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span>&laquo;</span></a>`;
    prevLi.onclick = (e) => {
        e.preventDefault();
        if (currentPage > 1) renderCourses(currentPage - 1);
    };
    pagination.appendChild(prevLi);

    // Цифровые страницы
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

    // Кнопка "Вперед" (стрелочка вправо)
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span>&raquo;</span></a>`;
    nextLi.onclick = (e) => {
        e.preventDefault();
        if (currentPage < totalPages) renderCourses(currentPage + 1);
    };
    pagination.appendChild(nextLi);
}

// --- ЛОГИКА РЕПЕТИТОРОВ ---

async function fetchTutors() {
    try {
        const response = await fetch(`${API_URL}/tutors?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка сети');
        allTutorsData = await response.json();
        
        // Вешаем события на фильтры
        document.getElementById('filter-tutor-language').addEventListener('change', applyTutorFilters);
        document.getElementById('filter-tutor-exp').addEventListener('input', applyTutorFilters);
        
        // Первая отрисовка (всех)
        renderTutors(allTutorsData);
    } catch (err) {
        console.error("Ошибка при загрузке репетиторов:", err);
    }
}

function applyTutorFilters() {
    const selectedLang = document.getElementById('filter-tutor-language').value; // Например, "English"
    const minExp = parseInt(document.getElementById('filter-tutor-exp').value) || 0;

    const filtered = allTutorsData.filter(tutor => {
        const matchesLang = selectedLang === "" || tutor.languages_spoken.includes(selectedLang);
        const matchesExp = tutor.work_experience >= minExp;
        
        return matchesLang && matchesExp;
    });

    renderTutors(filtered);
}

function renderTutors(tutors) {
    const container = document.getElementById('tutors-container');
    container.innerHTML = '';

    if (tutors.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>Репетиторы не найдены</p></div>';
        return;
    }

    tutors.forEach(tutor => {
        const div = document.createElement('div');
        div.className = 'col-md-4 mb-3';
        div.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${tutor.name}</h5>
                    <p class="card-text">Опыт: ${tutor.work_experience} лет</p>
                    <p class="card-text">Языки: ${tutor.languages_spoken.join(', ')}</p>
                    <p class="card-text text-primary fw-bold">${tutor.price_per_hour} руб/час</p>
                </div>
            </div>`;
        container.appendChild(div);
    });
}

function setMinimumDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateStr = tomorrow.toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(i => i.min = minDateStr);
}

// Открытие модального окна и расчет цены
let currentCourse = null;

function openOrderModal(courseId) {
    currentCourse = coursesData.find(c => c.id === courseId);
    if (!currentCourse) return;

    document.getElementById('course-id').value = currentCourse.id;
    document.getElementById('course-name').value = currentCourse.name;
    const totalHours = currentCourse.total_length * currentCourse.week_length;
    document.getElementById('duration').value = totalHours;

    document.querySelectorAll('.option-check').forEach(c => c.checked = false);
    document.getElementById('persons-count').value = 1;
    calculatePrice();

    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
}

// Динамический пересчет цены 
document.getElementById('order-form').addEventListener('change', calculatePrice);
document.getElementById('order-form').addEventListener('input', calculatePrice);

function calculatePrice() {
    if (!currentCourse) return;

    // Базовая стоимость: цена/час * кол-во часов
    let price = currentCourse.course_fee_per_hour * (currentCourse.total_length * currentCourse.week_length);
    
    // Количество человек
    const persons = parseInt(document.getElementById('persons-count').value) || 1;
    
    // Проверка времени для надбавок (упрощенная логика по заданию) [cite: 237-238]
    const timeStart = document.getElementById('start-time').value; // HH:MM
    if (timeStart) {
        const hour = parseInt(timeStart.split(':')[0]);
        if (hour >= 9 && hour <= 12) {
            price += 400; // morningSurcharge
        } else if (hour >= 18 && hour <= 20) {
            price += 1000; // eveningSurcharge
        }
    }

    // Проверка даты (выходные)
    const dateStart = new Date(document.getElementById('start-date').value);
    if (!isNaN(dateStart)) {
        const day = dateStart.getDay();
        if (day === 0 || day === 6) {
            price *= 1.5;
        }
    }

    price *= persons;

    // Доп. опции
    if (document.getElementById('early-registration').checked) {
        price *= 0.9; // -10%
    }
    if (document.getElementById('intensive-course').checked) {
        price *= 1.2; // +20%
    }
    if (document.getElementById('supplementary').checked) {
        price += 2000 * persons; // +2000 за каждого
    }
    if (document.getElementById('personalized').checked) {
        price += 1500 * currentCourse.total_length; // за каждую неделю
    }
    if (document.getElementById('excursions').checked) {
        price *= 1.25; // +25%
    }
    if (persons >= 5) { 
         price *= 0.85; 
    }

    document.getElementById('total-price').innerText = Math.round(price);
}

// Отправка формы (POST запрос) [cite: 197]
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
        showAlert(error.message, 'danger');
    }
});

function showAlert(message, type) {
    const alertPlaceholder = document.getElementById('alerts-container');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('');
    alertPlaceholder.append(wrapper);
    
    setTimeout(() => {
        wrapper.remove();
    }, 5000);
}

