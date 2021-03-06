# i2b2 Export Service
[Atlanta Clinical and Translational Science Institute (ACTSI)](http://www.actsi.org), [Emory University](http://www.emory.edu), Atlanta, GA

## What does it do?
It is a module of the [I2b2 Export](https://github.com/eurekaclinical/i2b2-export) project providing a web service for exporting i2b2 patient data. It runs as a standard Java web application.

## Version 1.1 development series
Latest release: [![Latest release](https://maven-badges.herokuapp.com/maven-central/org.eurekaclinical/i2b2-export-service/badge.svg)](https://maven-badges.herokuapp.com/maven-central/org.eurekaclinical/i2b2-export-service)

The 1.1 development series will migrate this package to the Eureka! Clinical build system.

## Version history
### Version 1.0
Initial release.

## Build requirements
* [Oracle Java JDK 8](http://www.oracle.com/technetwork/java/javase/overview/index.html)
* [Maven 3.2.5 or greater](https://maven.apache.org)

## Runtime requirements
* [Oracle Java JRE 8](http://www.oracle.com/technetwork/java/javase/overview/index.html)
* [Tomcat 7](https://tomcat.apache.org)
* [i2b2 version 1.7](http://www.i2b2.org)
* One of the following relational databases:
  * [Oracle](https://www.oracle.com/database/index.html) 11g or greater
  * [PostgreSQL](https://www.postgresql.org) 9.1 or greater
  * [H2](http://h2database.com) 1.4.193 or greater (for testing)

## Building it
Follow the build instructions for the parent project. You can build this project separately by going to the parent project's root directory, and running `mvn clean install -pl i2b2-export-service` or `mvn install -pl i2b2-export-service`.

## Installation
### Database schema creation
A [Liquibase](http://www.liquibase.org) changelog is provided in `src/main/resources/dbmigration/` for creating the schema's objects. [Liquibase 3.3 or greater](http://www.liquibase.org/download/index.html) is required. A suitable copy of Liquibase is provided in the `i2b2-export-package` module.
Perform the following steps:
1) Create a schema for i2b2-export-service in your database.
2) Get a JDBC driver for your database and put it the liquibase lib directory.
3) Run the following:
```
./liquibase \
      --driver=JDBC_DRIVER_CLASS_NAME \
      --classpath=/path/to/jdbcdriver.jar:/path/to/i2b2-export-service.war \
      --changeLogFile=dbmigration/changelog-master.xml \
      --url="JDBC_CONNECTION_URL" \
      --username=DB_USER \
      --password=DB_PASS \
      update
```
4) Add the following Resource tag to Tomcat's `context.xml` file:
```
<Context>
...
    <Resource name="jdbc/I2b2ExportServiceDS" auth="Container"
            type="javax.sql.DataSource"
            driverClassName="JDBC_DRIVER_CLASS_NAME"
            factory="org.apache.tomcat.jdbc.pool.DataSourceFactory"
            url="JDBC_CONNECTION_URL"
            username="DB_USER" password="DB_PASS"
            initialSize="3" maxActive="20" maxIdle="3" minIdle="1"
            maxWait="-1" validationQuery="SELECT 1" testOnBorrow="true"/>
...
</Context>
```

The validation query above is suitable for PostgreSQL. For Oracle and H2, use
`SELECT 1 FROM DUAL`.

### Configuration file creation
There are two application properties that must be configured in order for the
service to communicate with your i2b2 installation. The two properties are:

i2b2ProxyUrl - The full URL of the i2b2 proxy cell. This is usually something like:
 http://hostname/webclient/index.php. Note that the hostname should usually be
 the external hostname of the server; 'localhost' or similar tends to not work,
 especially when using HTTPS.

i2b2ServiceHostUrl - The URL where the core i2b2 services are hosted. The i2b2
 Export Service will specify this URL as the location the i2b2 proxy should 
 redirect the request to. Under most i2b2 installations, this is usually:
 http://localhost:9090.


These properties are specified in a standard Java properties file. By default,
the application looks for the file in /etc/i2b2export/i2b2export.properties.
This location can be overridden using the Java system property `i2b2export.propertiesFile`.

A Tomcat restart is required to detect any changes to the configuration file.

### WAR installation
1) Stop Tomcat.
2) Remove any old copies of the unpacked war from Tomcat's webapps directory.
3) Copy the warfile into the tomcat webapps directory.
4) Start Tomcat.

## Getting help
Feel free to contact us at help@eurekaclinical.org.
