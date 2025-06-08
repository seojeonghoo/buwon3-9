document.addEventListener('DOMContentLoaded', () => { // 첫 번째 DOMContentLoaded 시작

    // 헤더 스크롤 조정 관련 코드
    const headerHeight = document.querySelector('header').offsetHeight;

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const targetOffsetTop = targetElement.offsetTop - headerHeight; // Adjust for the header height
                window.scrollTo({
                    top: targetOffsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    console.log('페이지가 로드되었습니다.');

    // 건의함 관련 코드 시작 (이전에는 두 번째 DOMContentLoaded 안에 있었음)
    const form = document.getElementById('suggestionForm');
    const suggestionInput = document.getElementById('suggestion');

    const formStatus = document.createElement('div');
    formStatus.id = 'formStatus';
    if (form) { // 폼이 존재할 때만 추가
        form.parentNode.insertBefore(formStatus, form.nextSibling);
    }

    if (form) { // 폼이 존재할 때만 이벤트 리스너 추가
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const suggestion = suggestionInput.value;

            if (!suggestion.trim()) {
                formStatus.textContent = '건의 내용을 입력해주세요.';
                formStatus.style.color = 'orange';
                return;
            }

            formStatus.textContent = '건의를 제출하는 중...';
            formStatus.style.color = 'blue';

            // 여기에 당신의 Google Apps Script 웹 앱 URL을 붙여넣으세요!
            // 이 URL은 이미 올바르게 설정되어 있으므로 변경할 필요는 없습니다.
            const webAppUrl = 'https://script.google.com/macros/s/AKfycbwptgimCLLyRsScOf-WAjt6k4T8S1l2WWDKox1BVkk_6lAELNFq6oLYIf2-iS-qyZTBmg/exec'; 

            const data = {
                suggestion: suggestion
            };

            fetch(webAppUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(data).toString(),
            })
            .then(response => {
                console.log('건의가 성공적으로 제출되었습니다 (no-cors 모드).');
                formStatus.textContent = '건의가 성공적으로 제출되었습니다! 감사합니다.';
                formStatus.style.color = 'green';
                form.reset();
            })
            .catch(error => {
                console.error('건의 제출 오류:', error);
                formStatus.textContent = '건의를 제출하는 데 오류가 발생했습니다. 다시 시도해 주세요.';
                formStatus.style.color = 'red';
            });
        });
    } // 건의함 관련 코드 끝

    // 네비게이션 토글 관련 코드
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) { 
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
            const isExpanded = navMenu.classList.contains('show');
            navToggle.setAttribute('aria-expanded', isExpanded);
            navToggle.textContent = isExpanded ? '접기▲' : '더보기▼';

            if (isExpanded) {
                const navRect = navToggle.getBoundingClientRect();
                navMenu.style.top = `${navRect.bottom}px`;
            }
        });

        // 메뉴 항목 클릭 시 메뉴 닫기
        navMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                navMenu.classList.remove('show');
                navToggle.textContent = '더보기▼';
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // 학사일정 관련 코드 시작
    let currentPage = 0;
    const itemsPerPage = 4;
    let noticeData = [];

    function displayNotices(page) {
        const noticesList = document.querySelector('#notices ul');
        if (!noticesList) return; // 요소가 없으면 함수 종료

        noticesList.innerHTML = '';
        
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const currentItems = noticeData.slice(start, end);
        
        currentItems.forEach(event => {
            const date = event.DTSTART;
            const month = date.substring(4, 6);
            const day = date.substring(6, 8);
            
            const formattedDate = `${month}월 ${day}일`;
            
            const li = document.createElement('li');
            li.innerHTML = `<a href="#">${formattedDate}: ${event.SUMMARY}</a>`;
            noticesList.appendChild(li);
        });
    }

    function updatePaginationButtons() {
        const totalPages = Math.ceil(noticeData.length / itemsPerPage);
        
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) prevBtn.disabled = currentPage === 0;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1;
    }
    
    fetch('cal.json')
        .then(response => response.json())
        .then(data => {
            noticeData = data.sort((a, b) => a.DTSTART.localeCompare(b.DTSTART));
            
            const noticesSection = document.getElementById('notices');
            if (noticesSection && !document.querySelector('.notice-pagination')) {
                const paginationDiv = document.createElement('div');
                paginationDiv.className = 'notice-pagination';
                paginationDiv.innerHTML = `
                    <button id="prevBtn">◀ 이전</button>
                    <button id="nextBtn">다음 ▶</button>
                `;
                noticesSection.appendChild(paginationDiv);

                // 버튼 이벤트 연결 추가
                document.getElementById('prevBtn').addEventListener('click', () => {
                    if (currentPage > 0) {
                        currentPage--;
                        displayNotices(currentPage);
                        updatePaginationButtons();
                    }
                });
                document.getElementById('nextBtn').addEventListener('click', () => {
                    const totalPages = Math.ceil(noticeData.length / itemsPerPage);
                    if (currentPage < totalPages - 1) {
                        currentPage++;
                        displayNotices(currentPage);
                        updatePaginationButtons();
                    }
                });
            }

            // 오늘 날짜가 있는 페이지 찾아서 이동
            const today = new Date();
            const todayStr = today.getFullYear().toString() +
                String(today.getMonth() + 1).padStart(2, '0') +
                String(today.getDate()).padStart(2, '0');
            
            const nextEventIndex = noticeData.findIndex(item => item.DTSTART >= todayStr);
            if (nextEventIndex !== -1) {
                currentPage = Math.floor(nextEventIndex / itemsPerPage);
            }
            
            displayNotices(currentPage);
            updatePaginationButtons();
        })
        .catch(error => console.error('데이터를 불러오는데 실패했습니다:', error));
    // 학사일정 관련 코드 끝

    // D-day 계산 및 표시
    const dDaySpan = document.getElementById('d-day');
    if (dDaySpan) {
        const today = new Date();
        const examDate = new Date(today.getFullYear(), 6, 2); // 7월은 6 (JavaScript Date 객체에서 월은 0부터 시작)
        // 만약 오늘 날짜가 시험 날짜를 지났다면 다음 해의 시험 날짜로 설정
        if (today > examDate) {
            examDate.setFullYear(today.getFullYear() + 1);
        }
        const diffTime = examDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        dDaySpan.textContent = `시험까지 D-${diffDays}`;
    }

    // 스크롤바 숨김 관련 CSS 속성 설정
    document.documentElement.style.scrollbarWidth = 'none';
    document.documentElement.style.overflow = '-moz-scrollbars-none';
    document.documentElement.style.msOverflowStyle = 'none';
    document.documentElement.style.setProperty('--scrollbar-width', '0');
    document.documentElement.style.setProperty('--scrollbar-height', '0');
    document.documentElement.style.overflow = 'scroll';
    document.documentElement.style.overflowX = 'hidden';

}); // 첫 번째 DOMContentLoaded 끝 (모든 스크립트가 이 안에 있어야 함)

