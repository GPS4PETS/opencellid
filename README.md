# opencellid
# Info
OpenCellID Server and Web interface

# Install
just import the docker-compose.yml to portainer
Add this ENV to the config:

    OPENCELLID_API_KEY = YOUROPENCELLIDAPIKEY

# Setup 
open shell in opencellid-server container and run
  
    cat /opt/opencellid/schema.sql | sqlite3 /opt/opencellid/sqlite/oci_cells.sqlite

# Install and Update DB
open shell in opencellid-server container and run
    
    update-db.sh
