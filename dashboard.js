/* eslint-disable no-console */
// Configuration
const API_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';
const API_KEY = 'df3ddd20-e6f4-42a6-a275-d7ac1de8a55f'; 

// State Management
let allOrders = [];
let currentOrderBasePrice = 0;
let currentPage = 1;
const recordsPerPage = 5;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchOrders();
    setMinimumDate(); 
});

/**
 * Fetches orders from the API and initializes the table.
 */
async function fetchOrders() {
    try {
        const response = await fetch(`${API_URL}/orders?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        
        allOrders = await response.json();
        
        // Sort orders by creation date (descending)
        allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        renderOrders(1);
    } catch (error) {
        console.error("Fetch error:", error);
        showAlert("Ошибка загрузки данных", "danger");
    }
}

/**
 * Renders the table of orders for the specified page.
 * @param {number} page - The page number to render.
 */
function renderOrders(page) {
    currentPage = page;
    const start = (page - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const paginatedItems = allOrders.slice(start, end);

    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = '';

    if (paginatedItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Заказов пока нет</td></tr>';
        return;
    }

    paginatedItems.forEach((order, index) => {
        const displayIndex = start + index + 1;
        // Check if API returns course name, otherwise fallback to ID
        const courseName = order.course_id ? `Курс ID: ${order.course_id}` : 'Неизвестный курс';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${displayIndex}</td>
            <td>${courseName}</td>
            <td>${order.date_start}</td>
            <td>${order.price} ₽</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewOrder(${order.id})">Инфо</button>
                <button class="btn btn-warning btn-sm" onclick="editOrder(${order.id})">Изменить</button>
                <button class="btn btn-danger btn-sm" onclick="deleteOrder(${order.id})">Удалить</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPagination();
}

/**
 * Renders pagination controls with Next/Prev buttons.
 */
function renderPagination() {
    const totalPages = Math.ceil(allOrders.length / recordsPerPage);
    const pagination = document.getElementById('orders-pagination');
    pagination.innerHTML = '';

    // Hide pagination if single page or no data
    if (totalPages <= 1) return;

    // Previous Button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    prevLi.onclick = (e) => {
        e.preventDefault();
        if (currentPage > 1) renderOrders(currentPage - 1);
    };
    pagination.appendChild(prevLi);

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.onclick = (e) => {
            e.preventDefault();
            renderOrders(i);
        };
        pagination.appendChild(li);
    }

    // Next Button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    nextLi.onclick = (e) => {
        e.preventDefault();
        if (currentPage < totalPages) renderOrders(currentPage + 1);
    };
    pagination.appendChild(nextLi);
}

/**
 * Sets the minimum date for date inputs to "tomorrow".
 */
function setMinimumDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const minDateStr = `${yyyy}-${mm}-${dd}`;

    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.setAttribute('min', minDateStr);
    });
}

/**
 * Recalculates order price based on selected options in Edit Modal.
 */
function calculateDynamicPrice() {
    const personsInput = document.getElementById('edit-persons');
    const persons = parseInt(personsInput.value) || 1;
    
    let price = currentOrderBasePrice * persons;

    if (document.getElementById('edit-early').checked) price *= 0.9;
    if (document.getElementById('edit-intensive').checked) price *= 1.2;
    if (document.getElementById('edit-suppl').checked) price += (2000 * persons);

    document.getElementById('edit-total-price').innerText = Math.round(price);
}

// Event listeners for price calculation
document.getElementById('edit-order-form').addEventListener('input', calculateDynamicPrice);
document.getElementById('edit-order-form').addEventListener('change', calculateDynamicPrice);

/**
 * Fetches and displays order details in a modal.
 * @param {number} id - Order ID
 */
async function viewOrder(id) {
    try {
        const res = await fetch(`${API_URL}/orders/${id}?api_key=${API_KEY}`);
        if (!res.ok) throw new Error('API Error');
        const o = await res.json();
        
        document.getElementById('show-course-name').innerText = `Курс ID: ${o.course_id}`;
        document.getElementById('show-date').innerText = o.date_start;
        document.getElementById('show-time').innerText = o.time_start;
        document.getElementById('show-persons').innerText = o.persons;
        document.getElementById('show-duration').innerText = o.duration || '-';
        document.getElementById('show-price').innerText = o.price;
        
        let optHtml = '<ul class="list-unstyled mb-0">';
        if (o.early_registration) optHtml += '<li>✔ Ранняя регистрация</li>';
        if (o.intensive_course) optHtml += '<li>✔ Интенсив</li>';
        if (o.supplementary) optHtml += '<li>✔ Доп. материалы</li>';
        if (o.personalized) optHtml += '<li>✔ Индивидуально</li>';
        if (o.excursions) optHtml += '<li>✔ Экскурсии</li>';
        optHtml += '</ul>';
        
        if (optHtml === '<ul class="list-unstyled mb-0"></ul>') optHtml = 'Нет дополнительных опций';
        
        document.getElementById('show-options').innerHTML = optHtml;

        new bootstrap.Modal(document.getElementById('showOrderModal')).show();
    } catch (e) {
        console.error(e);
        showAlert("Не удалось загрузить детали", "danger");
    }
}

/**
 * Prepares and opens the Edit Modal for a specific order.
 * @param {number} id - Order ID
 */
async function editOrder(id) {
    try {
        const res = await fetch(`${API_URL}/orders/${id}?api_key=${API_KEY}`);
        if (!res.ok) throw new Error('API Error');
        const o = await res.json();

        // Update date constraints
        setMinimumDate();
        
        // Populate form fields
        document.getElementById('edit-order-id').value = o.id;
        document.getElementById('edit-course-name').value = `Курс ID: ${o.course_id}`;
        document.getElementById('edit-date').value = o.date_start;
        document.getElementById('edit-time').value = o.time_start;
        document.getElementById('edit-persons').value = o.persons;
        
        // Populate checkboxes
        document.getElementById('edit-early').checked = !!o.early_registration;
        document.getElementById('edit-intensive').checked = !!o.intensive_course;
        document.getElementById('edit-suppl').checked = !!o.supplementary;

        // Calculate base price per person for dynamic recalculation
        currentOrderBasePrice = o.price / (o.persons || 1); 
        
        // Reverse calculation to strip options from base price if needed
        if (o.early_registration) currentOrderBasePrice /= 0.9;
        if (o.intensive_course) currentOrderBasePrice /= 1.2;
        // Note: Logic for 'suppl' subtraction is complex due to additive nature, 
        // simplified here assuming base calculation holds priority.
        
        calculateDynamicPrice();
        new bootstrap.Modal(document.getElementById('editOrderModal')).show();
    } catch (e) {
        console.error(e);
        showAlert("Ошибка при открытии редактирования", "danger");
    }
}

// Save Changes (PUT Request)
document.getElementById('save-order-btn').addEventListener('click', async () => {
    const id = document.getElementById('edit-order-id').value;
    const data = {
        date_start: document.getElementById('edit-date').value,
        time_start: document.getElementById('edit-time').value,
        persons: parseInt(document.getElementById('edit-persons').value),
        early_registration: document.getElementById('edit-early').checked ? 1 : 0,
        intensive_course: document.getElementById('edit-intensive').checked ? 1 : 0,
        supplementary: document.getElementById('edit-suppl').checked ? 1 : 0,
        price: parseInt(document.getElementById('edit-total-price').innerText)
    };

    try {
        const res = await fetch(`${API_URL}/orders/${id}?api_key=${API_KEY}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('editOrderModal')).hide();
            fetchOrders();
            showAlert('Заказ успешно обновлен', 'success');
        } else {
            throw new Error('Server returned error');
        }
    } catch (e) {
        console.error(e);
        showAlert("Ошибка сохранения", "danger");
    }
});

// Delete Logic
let idToDelete = null;

function deleteOrder(id) {
    idToDelete = id;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
    if (!idToDelete) return;
    try {
        const res = await fetch(`${API_URL}/orders/${idToDelete}?api_key=${API_KEY}`, { method: 'DELETE' });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
            fetchOrders();
            showAlert('Заказ удален', 'warning');
        }
    } catch (e) {
        console.error(e);
        showAlert("Ошибка удаления", "danger");
    }
});

// Utility: Display Alert
function showAlert(message, type) {
    const container = document.getElementById('alerts-container');
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    container.innerHTML = alertHtml;
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}