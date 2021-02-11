# webrtc-dev-tornado <br />
#WebRTC project one-to-one video call <br />
This is a demo project on WebRTC one-to-one video call with chat option. <br />
Frontend: HTML, Javascript, Jquery, CSS, Bootstrap <br />
Web server and WebRTC framework : Tornado with Python3 <br />
Database: mysql <br />

Follow the steps mentioned below to deploy the server into cloud: <br />
1. Requirements: <br />
Ubuntu 20.04 LTS <br />
python3.8.5 <br />
2. Install following dependencies: <br />
#apt update <br />
#apt install python3-pip <br />
#pip3 install tornado <br />
#pip3 install PyCrypto <br />
#pip3 install pymysql <br />
3. Setup database <br />
#sudo apt-get install mysql-server <br />
#sudo systemctl start mysql <br />
//Press enter if password asked for root <br />
#sudo mysql -u root -p <br />
   mysql> CREATE USER 'collagein'@'localhost' IDENTIFIED BY 'Colin@1'; <br />
   mysql> GRANT ALL PRIVILEGES ON * . * TO 'collagein'@'localhost'; <br />
   mysql> FLUSH PRIVILEGES; <br />
//login as user use above passowd <br />
#mysql -u collagein -p <br />
	//create the db <br />
	mysql> CREATE DATABASE collageindb;
4. Get the server code  into your workspace and get into the folder "webrtc-dev-main". <br />
6. Use ./configure.sh file to create config file with ssl enable/disable option and to create database tables. <br />
#./configure.sh [-s 0] [-d  1] <br />
        -s Enter 0 to disable SSL and 1 to enable SSL(default:1) <br />
        -d Enter 1 to create DB(default:0) <br />
 Note: When ./configure.sh is run without any option it creates configuration with SSL enable and don't try to create the data base tables; <br />
 ./configure.sh with -d option should be run once in the beginning. <br />
 sig-server.conf file contains the configuration. <br />
7. [Optional] Self signed ssl key and certificate are available in "certs" folder. These keys and certificate file names are used in server.py for ssl. <br />
You can create your own by using the follwoing command. <br />
#openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout key.pem -out certificate.pem <br />
8. use start-server.sh to run the server and get the Server URL in the screen. <br />
9. use stop-server.sh and restart-server.sh to stop and restart the server respectively. <br />
10. log can be seen in sig-server.log file.
