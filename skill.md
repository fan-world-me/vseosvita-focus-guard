# ADB Deploy Skill

Навык для подключения к Android-устройству по ADB и обновления расширения на телефоне.

## Что делает

1. Подключается к Android-устройству по ADB через Wi-Fi (IP:порт)
2. Удаляет старый XPI из папки на телефоне
3. Собирает новую версию расширения (`package-extensions.ps1`)
4. Загружает новый XPI с компьютера на телефон
5. Устанавливает расширение в Firefox Nightly через `web-ext`

## Шаги выполнения

### 1. Подключение к устройству

```powershell
adb connect <IP>:<PORT>
```

Пример:
```powershell
adb connect 192.168.31.204:44239
```

### 2. Пересборка расширения

```powershell
cd "C:\Users\yarik\Desktop\vseosvita-focus-guard"
.\package-extensions.ps1
```

### 3. Удаление старого файла на телефоне

```powershell
adb shell "rm /sdcard/Recordings/vseosvita-focus-guard-firefox.xpi"
```

### 4. Загрузка нового XPI на телефон

```powershell
adb push "C:\Users\yarik\Desktop\vseosvita-focus-guard\dist\vseosvita-focus-guard-firefox.xpi" /sdcard/Recordings/
```

### 5. Установка расширения в Firefox Nightly

```powershell
$job = Start-Job -ScriptBlock {
    cd "C:\Users\yarik\Desktop\vseosvita-focus-guard\dist\firefox-unpacked"
    web-ext run --target=firefox-android --android-device=192.168.31.204:44239 --firefox-apk=org.mozilla.fenix --firefox-apk-component=.HomeActivity --adb-remove-old-artifacts 2>&1
}

$installed = $false
while (-not $installed) {
    Start-Sleep -Milliseconds 500
    $lines = Receive-Job $job
    foreach ($line in $lines) {
        Write-Output $line
        if ($line -match "Installed .* as a temporary add-on") {
            Write-Output "✅ Расширение установлено! Останавливаю..."
            $installed = $true
        }
    }
}

Stop-Job $job
Remove-Job $job
Write-Output "✅ Готово."
```

> **Важно:**
> - `--android-device` — IP:порт может меняться, уточнять у пользователя
> - Не использовать `am start -d file://...` — Firefox открывает XPI как URL (серый экран), не работает
> - На телефоне должна быть включена удалённая отладка: Settings → Developer Tools → Remote Debugging via USB

### 6. Проверка результата

```powershell
adb shell "ls -lh /sdcard/Recordings/"
```

## Полный путь файлов

| Откуда (ПК) | Куда (Телефон) |
|---|---|
| `C:\Users\yarik\Desktop\vseosvita-focus-guard\dist\vseosvita-focus-guard-firefox.xpi` | `/sdcard/Recordings/vseosvita-focus-guard-firefox.xpi` |

## Примечания

- Порт ADB может меняться при каждом переподключении телефона — уточнять у пользователя
- IP телефона: `192.168.31.204` (может меняться при смене сети)
- Папка на телефоне: `/sdcard/Recordings/`
- Chrome-версия на телефон не нужна — только Firefox XPI
