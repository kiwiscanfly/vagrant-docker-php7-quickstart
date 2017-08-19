#!/bin/sh

echo "halt script"

DATE=`date +%Y-%m-%d_%H:%M:%S`
BACKUP_DIR="/vagrant/db_backup/"

if [ ! -d "$BACKUP_DIR" ]; then
    mkdir "$BACKUP_DIR"
fi

cd "$BACKUP_DIR"

for i in `mysql -h192.168.51.8 -P8183 -u root -pyourpassword -e "show databases;" | grep -Ev "^(Database|mysql|performance_schema|information_schema)$"`; do
    sudo mysqldump -h192.168.51.8 -P8183 -c -u root -pyourpassword ${i} > ${i}-$DATE.sql
done