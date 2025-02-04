/** 
Script to Report the Version numbers and interesting Data out of ProWatch
Execute this script in SSMS
**/

use PWNT 
go

--SQL Version
SELECT @@VERSION

-- used space
EXEC sp_spaceused

--HI_QUEUE Size
SELECT COUNT(*) as "HI_QUEUE Size (should be < 1k lines)" FROM HI_QUEUE

-- ProWatch version
SELECT CONCAT(VER_MAJOR_NUM,'.',VER_MINOR_NUM, ' Build ', Build_No) as "ProWatch DB Version" FROM db_version

--Panel Firmware Version
SELECT DESCRP as "Panel Description", LOCATION, FIRMWARE_VERSION, INSTALLED FROM Panel

--SubPanel Firmware Version
SELECT HWDESCRP as "Panel Type", DESCRP as "Panel Name", SPANEL.FIRMWARE_VERSION, SPANEL.INSTALLED FROM SPANEL INNER JOIN Panel on SPANEL.PPID LIKE (PANEL.PPID + '00')

--Alarms
SELECT COUNT(LOGDEVDESCRP) AS ALARMS, LOGDEVDESCRP as "Logical Device", INSTALLED FROm EV_LOG INNER JOIN AL_PTS ON AL_PTS.ADDR = EV_LOG.EVNT_ADDR INNER JOIN AL_TYP ON AL_PTS.ALTYP = AL_TYP.ID INNER JOIN LOGICAL_DEV_D ON EV_LOG.LOGDEVID = LOGICAL_DEV_D.ID WHERE AL_TYP.ALARM_PROC = 'Y' AND EVNT_DAT > DATEADD(day, -365, GETDATE()) GROUP BY LOGDEVDESCRP, INSTALLED ORDER BY ALARMS DESC

--Uninstalled Devices
SELECT COUNT(INSTALLED) as "Uninstalled Devices" FROM LOGICAL_DEV_D WHERE INSTALLED <> 'Y'
SELECT DESCRP, INSTALLED FROM LOGICAL_DEV_D INNER JOIN LOGICAL_DEV ON LOGICAL_DEV.ID = LOGICAL_DEV_D.ID WHERE INSTALLED <> 'Y'

--Reader Grants
SELECT LOGDEVDESCRP, COUNT(LOGDEVDESCRP) GRANTS FROm EV_LOG WHERE EVNT_DESCRP LIKE '%Grant%' GROUP BY LOGDEVDESCRP ORDER BY GRANTS DESC

--Busiest Day
SELECT COUNT(CONVERT(DATE, EVNT_DAT)) AS AMOUNT , CONVERT(DATE, EVNT_DAT) AS DATUM FROm EV_LOG WHERE EVNT_DESCRP LIKE '%Grant%' GROUP BY CONVERT(DATE, EVNT_DAT) ORDER BY AMOUNT DESC
