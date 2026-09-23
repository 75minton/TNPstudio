# TNP Studio

독립 음악 플레이어 프로젝트. 원본 75minton 프로젝트와 별도로 복사한 작업본입니다.

## 실행

이 폴더에서 `python -m http.server 8000` 실행 후 http://localhost:8000/ 을 여세요. HTML을 더블 클릭하면 서비스 워커/PWA와 데이터 로딩 기능을 사용할 수 없습니다.

## 브랜딩

- 디자인: studio-theme.css (Crimson / Charcoal / Warm Ivory)
- 로고 원본: icons/tnp-studio-logo.png (845 × 845, 제공 파일 그대로)
- 홈페이지 소개: index.html, home-content.js
- 곡 데이터: songs.json, sound/
- 원곡의 제목, 아티스트, 가사, 커버는 보존했습니다.

## 배포 전

HTTPS 서버에 music 폴더 내용을 배포하세요. 기존 Git 저장소와 원격 연결은 복사하지 않았습니다.
GA4는 기본 비활성화입니다. analytics-config.js에 TNP Studio 전용 ID를 입력하면 활성화됩니다.
운영 도메인이 정해지면 canonical, og:url, 공유 이미지의 절대 URL과 sitemap.xml을 설정하세요. 현재 내부 링크와 미디어는 상대 경로로 구성되어 있습니다.

## 검증 도구

Playwright/Edge가 있는 환경에서 check-pwa.cjs 및 scripts/check-share-pages.cjs를 사용할 수 있습니다.
