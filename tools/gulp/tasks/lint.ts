import gulp = require('gulp');
import { execNodeTask } from '../task_helpers';

gulp.task('lint', ['tslint', 'stylelint']);
gulp.task('stylelint', execNodeTask(
  'stylelint', ['src/**/*.scss', '--config', 'stylelint-config.json', '--syntax', 'scss']
));
gulp.task('tslint', execNodeTask('tslint', ['-c', 'tslint.json', 'src/**/*.ts']));
