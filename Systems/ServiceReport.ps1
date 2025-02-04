<#
Summarizing Windows Server maintenance Properties
#>
#Check Windows Version
echo "[Check]Checking Windows Version ..."
(Get-WmiObject -class Win32_OperatingSystem).Caption


# Check Disk Space of all FileSystem Drives
echo "`n[Check]Checking Disk Space ..."
Get-PSDrive | ? { $_.Provider.Name -eq 'FileSystem' }

echo "`n[Check]Checking physical disks ..."
Get-PhysicalDisk | Select-Object MediaType, OperationalStatus, HealthStatus, CanPool, Size, FriendlyName, DeviceID

# Check for available Updates
echo "`n[Check]Searching for available Updates ..."
(New-Object -ComObject Microsoft.Update.Session).CreateupdateSearcher().Search('IsHidden=0 and IsInstalled=0').Updates | Select-Object Title

# measure average CPU usage
echo "`n[Check]Measuring Average CPU Usage in percent..."
$i=1
for(;$i -le 10;$i++)
{
    get-ciminstance -class win32_processor | measure -Property LoadPercentage -average |select Average
}
# measure RAM usage
echo "`n[Check]Measuring Free RAM in KB..."
Get-CIMInstance Win32_OperatingSystem | Select FreePhysicalMemory

# List Local Users
echo `n"[Check]Listing Local Users ..."
Get-LocalUser