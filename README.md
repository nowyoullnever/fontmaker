# fontmaker

개인용 모바일 우선 한글 웹 폰트 빌더입니다. 그림 데이터는 서버로 업로드되지 않고 현재 브라우저의 IndexedDB에 저장됩니다.

## 실행 방법

```bash
npm install
npm run dev
npm run dev:host
```

PowerShell:

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run dev:host
```

## 휴대폰에서 로컬 테스트하기

같은 네트워크의 휴대폰에서 테스트하려면 `npm run dev:host`를 실행한 뒤 Vite가 보여주는 네트워크 주소로 접속합니다.

## 프로덕션 빌드 확인

```bash
npm test
npm run typecheck
npm run build
npm run preview
npm run preview:host
```

PowerShell:

```bash
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run preview
npm.cmd run preview:host
```

## GitHub Pages 배포

`main` 브랜치에 push하면 GitHub Actions가 테스트, 타입 검사, 빌드를 통과한 뒤 `dist`를 GitHub Pages에 배포합니다. 배포 경로는 `/fontmaker/`입니다.

## 기존 작업 옮기기

로컬 개발 주소와 GitHub Pages 주소는 브라우저 저장소가 서로 다릅니다. 기존 작업을 옮기려면:

1. 기존 로컬 앱을 엽니다.
2. `백업 파일 저장`으로 JSON 백업을 받습니다.
3. GitHub Pages 앱을 엽니다.
4. `백업 파일 불러오기`로 JSON 파일을 선택합니다.
5. 교체 확인을 누릅니다.
6. 그림과 완료 상태가 복원됐는지 확인합니다.

## 데이터 주의사항

브라우저 사이트 데이터를 지우면 저장된 그림이 사라질 수 있습니다. JSON 백업 파일을 주기적으로 보관하세요. 생성된 TTF는 파일로 다운로드될 뿐 자동 설치되지는 않습니다.

