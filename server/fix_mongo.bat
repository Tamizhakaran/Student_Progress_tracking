@echo off
net stop MongoDB
del /q /s /f "C:\Program Files\MongoDB\Server\8.0\data\diagnostic.data\*.*"
net start MongoDB
