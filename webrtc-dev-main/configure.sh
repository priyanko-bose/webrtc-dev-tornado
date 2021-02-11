helpFunction()
{
   echo ""
   echo "Usage: $0 -s [0/1]"
   echo -e "\t-s Enter 0 to disable SSL else enter 1(default:1)"
   echo -e "\t-d Enter 1 to create DB else enter 0(default:0)"
   exit 1 # Exit script after printing help
}
ssl_enabled=1
create_db=0
while getopts "s:d:" opt
do
   case "$opt" in
      s ) ssl_enabled="$OPTARG" ;;
      d ) create_db="$OPTARG" ;;
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done
if [[ $ssl_enabled -ne 0 && $ssl_enabled -ne 1 ]]
then 
    ssl_enabled=1
fi    
confname="sig-server.conf"
tempconfname=$confname'.tmp'
logfilename="sig-server.log"
http_port="8080"
https_port="8443"
if [ -f $tempconfname ]
then
    rm $tempconfname
fi

echo '{' > $tempconfname
echo '    "server" : {' >> $tempconfname
echo '        "ssl_enabled" : '$ssl_enabled',' >> $tempconfname
privateip="$(hostname -I|xargs)"
echo '        "private_ip" : "'$privateip'",' >> $tempconfname
echo '        "http_port" : "'$http_port'",' >> $tempconfname
echo '        "https_port" : "'$https_port'",' >> $tempconfname
privatedns="$(hostname -f|xargs)"
echo '        "private_fqdn" : "'$privatedns'",' >> $tempconfname
publicip="$(curl -s http://checkip.amazonaws.com|xargs)"
echo '        "public_ip" : "'$publicip'",' >> $tempconfname
new2="${publicip//./-}"
publicdns="$(echo "ip-172-31-9-249.ap-south-1.compute.internal" |sed 's|^ip-[0-9]\{1,3\}\-[0-9]\{1,3\}\-[0-9]\{1,3\}\-[0-9]\{1,3\}|ec2-'"${new2}"'|g'| sed -e s/\.internal$/.amazonaws.com/)"
echo '        "public_fqdn" : "'$publicdns'"' >> $tempconfname
echo '    },' >> $tempconfname
echo '    "logger" : {' >> $tempconfname
echo '        "file_name" : "'$logfilename'"' >> $tempconfname 
echo '    }' >> $tempconfname
echo '}' >> $tempconfname
mv $tempconfname $confname

if [[ $create_db -eq 1 ]]
then
    echo "Here"
    out=$(python3 dbMgr.py)
    echo $out
fi
