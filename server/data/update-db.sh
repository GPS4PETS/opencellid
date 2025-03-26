cd /opt/opencellid/

rm /opt/opencellid/oci_cells.csv.gz
rm /opt/opencellid/oci_cells.csv

date
echo "DOWNLOAD FILE"
wget -O /opt/opencellid/oci_cells.csv.gz "https://download.unwiredlabs.com/ocid/downloads?token=pk.b3962295d51013cd924ddea0eead2a78&file=cell_towers.csv.gz"
echo "UNPACK"
gzip -d /opt/opencellid/oci_cells.csv.gz 

date > /opt/opencellid/update.html

date
echo "CAT IMPORT"
cat /opt/opencellid/oci_import.sql | sqlite3 /opt/opencellid/sqlite/oci_cells.sqlite
date
echo "CAT CLEANUP"
cat /opt/opencellid/oci_cells-cleanup.sql | sqlite3 /opt/opencellid/sqlite/oci_cells.sqlite

date
echo "SCP UPDATE.HTML"
scp /opt/opencellid/update.html root@192.168.88.238:/var/www/html/opencellid.gps4pets.de/update.html

date
echo "END"
