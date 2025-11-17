export default function ModulesDao(db) {
    function findModulesForCourse(courseId) {
      const { modules } = db;
      return modules.filter((module) => module.course === courseId);
    }
    return {
      findModulesForCourse,
    };
   }
   