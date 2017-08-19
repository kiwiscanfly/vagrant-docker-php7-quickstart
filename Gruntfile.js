module.exports = function(grunt) {
  
  // https://www.npmjs.com/package/grunt-rsync

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    //rsync handles the file transfers of our static assets.
    //we use rsync because it checks to see if a file is already
    //at the destination, saving tons of bandwidth and time for
    //file uploads.
    rsync: {
      options: {
      //  args: ["--verbose", "--checksum"],
        //Be sure to exclude any files that pose a security risk if published, or simply
        //aren't needed for your site to function.
        excludeFirst: [
          "._*",
          ".DS_Store",
          ".smbdelete*",
          "Gruntfile.js",
          ".git/",
          "tmp/*",
          "db_backup/",
          "wp-config.php",
          "composer.json",
          "composer.lock",
          "README.md",
          ".gitignore",
          "package.json",
          "node_modules",
        ],
        include: [
          "phpsite/",
          "phpsite/**",
          "haproxy/",
          "haproxy/certs/",
          "haproxy/certs/**",
          "haproxy/Dockerfile",
          "haproxy/haproxy_prod.cfg",
          "deploy.sh",
          "docker-compose.yml"
        ],
        exclude: ["*"],
        recursive: true
      },

      prod: {
        options: {
          src: "./",
          dest: "/docker",
          host: "username@yoursite.com",
          port: "22", //default SSH port is 22, some hosts move it
          dryRun: true, //To test the rsync operation before performing a real transfer, change this to true
          args: ["--links"],
          delete: true // Careful this option could cause data loss, read the docs!
        }
      },
    },

    //This is not a task, but a json object we use to store our local
    //and development database credentials.
    //NOTE: SECURITY RISK. Don't share your real database credentials
    //with anyone, ever.
    mysql: {
      "remote": {
        "host":                       "site.com",
        "site_url":                   "http://site.com",
        "username":                   "admin",
        "dbname":                     "wp_livesitedb",
        "dbuser":                     "wp_livesitedbuser",
        "dbpass":                     "livesitedbpass",
        "dbhost":                     "localhost", //probably localhost, check with your host
        "save_path":                  "/home/html/site.com/peach",
        "save_url":                   "http://site.com/peach",
        "upload_path":                "/home/html/site.com/peach/",
      },
      "local": {
        "site_url":                   "http://site.local",
        "dbname":                     "wp_localsitedb",
        "dbuser":                     "wp_localsitedbuser",
        "dbpass":                     "root",
        "dbhost":                     "localhost",
        "dump_dir":                   "/Users/cooldude/Documents/Sites/site.com/peach/",
        "dump_dir_theme_relative":    "/Users/cooldude/Documents/Sites/site.com/peach/"
      }
    },

    //This weird little thing is just used to store the current time of
    //when the tasks are run. Used to differentiate SQL dumps.
    timestamp: grunt.template.today('mm-dd-yyyy_HH-MM-ss'),

    //grunt-ssh is what it sounds like. It can be used for both SSH and SFTP tasks.
    sshexec: {
      options: {
        host: '45.33.15.44',
        username: 'daryl',
        //agent: process.env.SSH_AUTH_SOCK
        privateKey: grunt.file.read("/Users/yourname/.ssh/id_rsa")
      },
      copy_haproxy_prod: {
        command: '/bin/bash /docker/deploy.sh <%= rsync.prod.options.dryRun %>'
      },

      dump_remote_db: {
        options: {
          host: '<%= mysql.remote.host %>',
          username: '<%= mysql.remote.username %>',
          agent: process.env.SSH_AUTH_SOCK,
          port: '123' //default SSH port is 22, some hosts move it
        },
        command: [
          'cd <%= mysql.remote.save_path %>',
          'mysqldump <%= mysql.remote.dbname %> -u <%= mysql.remote.dbuser %> -p<%= mysql.remote.dbpass %> > remote-<%= timestamp %>.sql'
        ].join(' && ')
      },
      cleanup_remote: {
        options: {
          host: '<%= mysql.remote.host %>',
          username: '<%= mysql.remote.username %>',
          agent: process.env.SSH_AUTH_SOCK,
          port: '123' //default SSH port is 22, some hosts move it
        },
        command: [
          'cd <%= mysql.remote.save_path %>',
          'rm local_migrated-<%= timestamp %>.sql'
        ].join(' && ')
      },
      cleanup_remote_dump: {
        options: {
          host: '<%= mysql.remote.host %>',
          username: '<%= mysql.remote.username %>',
          agent: process.env.SSH_AUTH_SOCK,
          port: '123' //default SSH port is 22, some hosts move it
        },
        command: [
          'cd <%= mysql.remote.save_path %>',
          'rm remote-<%= timestamp %>.sql'
        ].join(' && ')
      },
      import_migrated_local_dump: {
        options: {
          host: '<%= mysql.remote.host %>',
          username: '<%= mysql.remote.username %>',
          agent: process.env.SSH_AUTH_SOCK,
          port: '123' //default SSH port is 22, some hosts move it
        },
        command: [
          'cd <%= mysql.remote.save_path %>',
          'mysql -u <%= mysql.remote.dbuser %> -p<%= mysql.remote.dbpass %> <%= mysql.remote.dbname %> < local_migrated-<%= timestamp %>.sql'
        ].join(' && ')
      },

      uat_to_stage: { 
        command: 'echo "todo:script to sync to live"'
      }
    },

    //grunt-exec allows us to run shell commands programmatically. 
    //In our case, we use this to drive our SQL database operations.
    exec: {
      wget_remote_dump: {
        command: 'wget -nv <%= mysql.remote.save_url %>/remote-<%= timestamp %>.sql'
      },
      import_migrated_remote_dump: {
        command: 'mysql -u <%= mysql.local.dbuser %> -p<%= mysql.local.dbpass %> <%= mysql.local.dbname %> < remote_migrated-<%= timestamp %>.sql'
      },
      cleanup_local: {
        command: 'rm -rf <%= mysql.local.dump_dir %>/local_migrated-<%= timestamp %>.sql'
      },
      cleanup_local_from_remote: {
        command: 'rm -rf remote-<%= timestamp %>.sql remote_migrated-<%= timestamp %>.sql'
      },
      dump_local_db: {
      //Not sure if this is necessary, but I opt to use the mysql installed
      //under my MAMP directory, because I typically use MAMP for WordPress
      //database management.
        command: 'mysqldump -u <%= mysql.local.dbuser %> -p<%= mysql.local.dbpass %> <%= mysql.local.dbname %> > <%= mysql.local.dump_dir %>local-<%= timestamp %>.sql'
      },
      //Note that the '-P 123' argument tells scp to use port 123 for connections.
      //The default port number is 22, but your host may have move SSH to another port.
      scp_local_dump: {
        command: 'scp -P 123 <%= mysql.local.dump_dir %>local_migrated-<%= timestamp %>.sql <%= mysql.remote.username %>@<%= mysql.remote.host %>:<%= mysql.remote.save_path %>'
      }
    },

    //grunt-peach is a tool to search and replace strings in sql database dumps. 
    // Handy for replacing replacing a development URL with the live one: <em>http://dev.site.local -> http://www.site.com
    peach: {
      search_replace_remote_dump: {
        options: {
          force: true
        },
        src:  'remote-<%= timestamp %>.sql',
        dest: 'remote_migrated-<%= timestamp %>.sql',
        from: '<%= mysql.remote.site_url %>',
        to:   '<%= mysql.local.site_url %>'
      },
      search_replace_local_dump: {
        options: {
          force: true
        },
        src:  '<%= mysql.local.dump_dir_theme_relative %>local-<%= timestamp %>.sql',
        dest: '<%= mysql.local.dump_dir_theme_relative %>local_migrated-<%= timestamp %>.sql',
        from: '<%= mysql.local.site_url %>',
        to:   '<%= mysql.remote.site_url %>'
      }
    }

  });

  //Load tasks involved in file transfer via rsync
  grunt.loadNpmTasks('grunt-rsync');

  //Load tasts involved in our sql export, import, and find-and-replace
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-peach');
  grunt.loadNpmTasks('grunt-ssh');

  
  //Define our tasks for pushing files via rsync
  //Note: you could define more of these for multiple servers.
  grunt.registerTask('prod', [
    'rsync:prod',
    'sshexec:copy_haproxy_prod'
  ]);


  //Define our task to PULL the database FROM our remote server.
  //Note: you could define more of these for multiple servers.
  grunt.registerTask('pull_db', [
    'sshexec:dump_remote_db',             //dump remote database
    'exec:wget_remote_dump',              //download remote dump
    'sshexec:cleanup_remote_dump',        //delete remote dump
    'peach:search_replace_remote_dump',   //search and replace URLs in database
    'exec:import_migrated_remote_dump',   //import the migrated database
    'exec:cleanup_local_from_remote'      //delete local database dump files
  ]);
   

  //Define our task to PUSH the database TO our remote server.
  //Note: you could define more of these for multiple servers.
  grunt.registerTask('push_db', [
    'exec:dump_local_db',                 //dump local database
    'peach:search_replace_local_dump',    //search and replace URLs in database
    'exec:scp_local_dump',                //upload local dump
    'exec:cleanup_local',                 //delete local database dump files
    'sshexec:import_migrated_local_dump', //import the migrated database
    'sshexec:cleanup_remote'              //delete remote database dump file
  ]);

};