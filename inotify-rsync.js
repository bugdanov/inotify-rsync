#!/usr/bin/env node
/*
 * inotify-rsync 
 *
 * Copyright (c) 2017 Rurik Bogdanov <rurik.bugdanov@alsenet.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
var csv_parse=require('csv-parser');
var child_process=require('child_process');
var watchdir=process.argv[2];
var rsync_destination=process.argv[3];
var inotifywait_options=process.argv.slice(4)||[];
var path=require('path');
var fs=require('fs');

if (!rsync_destination) {
  console.log('usage: inotify-sync <dirname> <rsync_destination> <inotifywait_options>');
  process.exit(1);
}

process.cwd(watchdir);

var inotifywait_args=[
  '-m',
  '--csv'
].concat(inotifywait_options);
console.log(inotifywait_options,inotifywait_args)

inotifywait_args.push('-r');
inotifywait_args.push('.');


var inotifywait=child_process.spawn('inotifywait',inotifywait_args,{
  cwd: watchdir,
  stdio: ['pipe','pipe',process.stderr]
});

var parser=csv_parse({
  delimiter: ',',
  columns: ['dirname','eventname','filename']

});

inotifywait.stdout.pipe(parser).on('data',function(row){
  var colname=['dirname','eventname','filename'];
  var i=0;
  var event={};
  for (var col in row) {
    event[colname[i++]]=row[col];
  }
  if (i<3) return;

  var pathname=path.join(watchdir,event.dirname,event.filename);
  fs.stat(pathname,function(err,stats){
    if (err) {
      console.log(err)
    } else if (stats.isFile()) {
      if (DEBUG) {
				console.error(event);
			}
      switch(event.eventname){
        case 'CLOSE_WRITE,CLOSE':
        case 'MOVED_TO':
          rsync(pathname,event.dirname);
          break;
      }
    }
  })

});

function rsync(pathname,destdir){
  var cmd=[
    'rsync -zav',
    pathname,
    path.join(rsync_destination,destdir)
  ];
  cmd.push('>&2');

  try {
    console.error(cmd.join(' '));
    var stdout=child_process.execSync(cmd.join(' '),{
      cwd: watchdir
    });

  } catch(e){
    console.log(e.message);
    notify('Copy failed: '+path.basename(pathname));
    return;
  }

  notify('Copy done: '+path.basename(pathname));

}

function notify(message){
  try {
    child_process.execSync("notify-send '"+message.replace(/'/,"\'")+"'");
  } catch(e) {
    console.log(e);
  }
  try {
    child_process.execSync("espeak '"+message.replace(/'/,"\'")+"'");
  } catch(e) {
    console.log(e);
  }
}

