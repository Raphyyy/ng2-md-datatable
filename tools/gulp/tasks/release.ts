import { spawn } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { task } from 'gulp';
import gulpRunSequence = require('run-sequence');
import path = require('path');
import minimist = require('minimist');

import { execTask, cleanTask } from '../task_helpers';
import { DIST_COMPONENTS_ROOT } from '../constants';

const argv = minimist(process.argv.slice(3));

task(':build:release:clean-spec', cleanTask('dist/**/*.spec.*'));

task('build:release', function (done: () => void) {
  gulpRunSequence(
    'clean',
    ':build:components:ngc',
    ':build:release:clean-spec',
    done
  );
});

/** Make sure we're logged in. */
task(':publish:whoami', execTask('npm', ['whoami'], {
  silent: true,
  errMessage: 'You must be logged in to publish.'
}));

function _execNpmPublish(label: string): Promise<void> {
  const packageDir = DIST_COMPONENTS_ROOT;

  if (!statSync(packageDir).isDirectory()) {
    return;
  }

  if (!existsSync(path.join(packageDir, 'package.json'))) {
    throw new Error(`"${packageDir}" does not have a package.json.`);
  }

  process.chdir(packageDir);
  console.log(`Publishing component...`);

  const command = 'npm';
  const args = ['publish', '--access', 'public', label ? `--tag` : undefined, label || undefined];
  return new Promise<any>((resolve, reject) => {
    console.log(`  Executing "${command} ${args.join(' ')}"...`);
    if (argv['dry']) {
      resolve();
      return;
    }

    const childProcess = spawn(command, args);
    childProcess.stdout.on('data', (data: Buffer) => {
      console.log(`  stdout: ${data.toString().split(/[\n\r]/g).join('\n          ')}`);
    });
    childProcess.stderr.on('data', (data: Buffer) => {
      console.error(`  stderr: ${data.toString().split(/[\n\r]/g).join('\n          ')}`);
    });

    childProcess.on('close', (code: number) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Component did not publish, status: ${code}.`));
      }
    });
  });
}

task(':publish', function (done: (err?: any) => void) {
  const label = argv['tag'];
  const currentDir = process.cwd();

  if (!label) {
    console.log('You can use a label with --tag=labelName.');
    console.log('Publishing using the latest tag.');
  } else {
    console.log(`Publishing using the ${label} tag.`);
  }
  console.log('\n\n');

  _execNpmPublish(label)
    .catch((err: Error) => done(err))
    .then(() => process.chdir(currentDir))
    .then(done);
});

task('publish', function (done: () => void) {
  gulpRunSequence(
    ':publish:whoami',
    'build:release',
    ':publish',
    done
  );
});
