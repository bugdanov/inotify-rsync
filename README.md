# inotify-rsync
Copy new or modified files using inotifywait and rsync.

## License
This project is licensed under AGPL-3.0

## Dependencies
apt-get install inotify-tools

## Optional dependencies
apt-get install libnotify-bin # for visual feedback using notify-send

apt-get install espeak # for audio feedback

## Install
npm install -g inotify-rsync

## Usage
    inotify-sync <dirname> <rsync_destination> <inotifywait_options>

## Example usage
    rsync -avz user@server:src/repo /src/
    
    inotify-rsync /src/repo/ user@host:src/repo --recursive --exclude '/\.git.*' --exclude '\.swp.?$'
    
    atom /src/repo
    vi /src/repo/vi-or-die.txt
