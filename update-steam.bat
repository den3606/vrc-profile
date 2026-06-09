@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js が見つかりません。https://nodejs.org/ からインストールしてください。
  exit /b 1
)

echo Steam データを取得しています...
node scripts/fetch-steam.js
if errorlevel 1 (
  echo.
  echo 更新に失敗しました。
  exit /b 1
)

echo.
echo steam.json を更新しました。
echo 反映するには commit / push してください。
endlocal
