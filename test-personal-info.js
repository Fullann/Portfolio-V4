const dbPool = require('./config/dbPool');
const personalInfoController = require('./controllers/personalInfo.controller');

async function runTest() {
  const req = {
    body: {
      name: "Test Name",
      title: "Test Title",
      email: "test@test.com",
      phone: "12345",
      birthday: "2000-01-01",
      location: "Test Loc",
      aboutText: "Test About",
      translations: JSON.stringify({
        fr: {
          title: "Test Title FR",
          aboutText: "Test About FR"
        }
      })
    },
    files: [
      { fieldname: 'cv_fr', filename: 'test_cv.pdf' }
    ]
  };

  const res = {
    json: (data) => {
      console.log("SUCCESS:", data);
      process.exit(0);
    },
    status: (code) => {
      console.log("STATUS:", code);
      return {
        json: (data) => {
          console.log("ERROR:", data);
          process.exit(1);
        }
      };
    }
  };

  const next = (err) => {
    console.error("NEXT ERR:", err);
    process.exit(1);
  };

  try {
    personalInfoController.updatePersonalInfo(req, res, next);
  } catch (e) {
    console.error("CAUGHT ERR:", e);
    process.exit(1);
  }
}

runTest();
