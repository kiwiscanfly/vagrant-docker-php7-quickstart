# -*- mode: ruby -*-
# vi: set ft=ruby :

unless Vagrant.has_plugin?("vagrant-docker-compose")
  system("vagrant plugin install vagrant-docker-compose")
  puts "Dependencies installed, please try the command again."
  exit
end

Vagrant.configure("2") do |config|
    config.vm.box = "debian/jessie64"

    config.vm.synced_folder ".", "/vagrant", type: "virtualbox"
  
    config.vm.provision "shell", path: "vagrant/provision.sh"
    config.vm.provision :docker
    config.vm.provision :docker_compose, yml: "/vagrant/docker-compose.yml", rebuild: true, run: "always"

    config.vm.network :private_network, id: "primary", ip: "192.168.51.8"

    config.vm.provider :hyperv do |v, override|
        override.vm.network :private_network, id: "primary", ip: nil
    end

    # run some script before the guest is halted
    config.trigger.before :halt do
        run_remote "bash /vagrant/vagrant/halt.sh"
    end

    config.vm.hostname = 'your-primary-domain.dev'
    config.hostsupdater.aliases = %w(alias-one.dev alias-two.dev)
end