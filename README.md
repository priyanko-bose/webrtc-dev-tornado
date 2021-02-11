# webrtc-dev-tornado
#WebRTC project one-to-one video call
This is a demo project on WebRTC one-to-one video call with chat option.
Frontend: HTML, Javascript, Jquery, CSS, Bootstrap
Web server and WebRTC framework : Tornado with Python3
Database: mysql

Follow the steps mentioned below to deploy the server into cloud:
1. Requirements:
Ubuntu 20.04 LTS
python3.8.5
2. Install following dependencies:
#apt update
#apt install python3-pip
#pip3 install tornado
#pip3 install PyCrypto
#pip3 install pymysql
3. Setup database
#sudo apt-get install mysql-server
#sudo systemctl start mysql
#sudo mysql -u root -p		-->"Press enter if password asked for root"
   mysql> CREATE USER 'collagein'@'localhost' IDENTIFIED BY 'Colin@1';
   mysql> GRANT ALL PRIVILEGES ON * . * TO 'collagein'@'localhost';
   mysql> FLUSH PRIVILEGES;
#mysql -u collagein -p	    -->"login as user use above passowd."
	//create the db
	mysql> CREATE DATABASE collageindb;
4. Get the server code  into your workspace and get into the folder "webrtc-dev-main".
6. Use ./configure.sh file to create config file with ssl enable/disable option and to create database tables.
./configure.sh [-s 0] [-d  1]
        -s Enter 0 to disable SSL and 1 to enable SSL(default:1)
        -d Enter 1 to create DB(default:0)
 Note: When ./configure.sh is run without any option it creates configuration with SSL enable and don't try to create the data base tables;
 ./configure.sh with -d option should be run once in the beginning.
 sig-server.conf file contains the configuration.
7. [Optional] Self signed ssl key and certificate are available in "certs" folder. These keys and certificate file names are used in server.py for ssl.
You can create your own by using the follwoing command.
#openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout key.pem -out certificate.pem
8. use start-server.sh to run the server and get the Server URL in the screen.
9. use stop-server.sh and restart-server.sh to stop and restart the server respectively.
10. log can be seen in sig-server.log file.
