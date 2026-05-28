const Company = require("../models/Company");
const StudentCompany = require("../models/StudentCompany");
const InterviewSchedule = require("../models/InterviewSchedule");
const User = require("../models/User");

// Student Controllers

// @desc    Get all companies for students
// @route   GET /api/user/companies
// @access  Private/User
const getStudentCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ status: "active" });

    // Get student's application status for each company
    const applications = await StudentCompany.find({ user: req.user._id });
    const appliedCompanyIds = applications.map((app) => app.company.toString());

    const companiesWithStatus = companies.map((company) => ({
      ...company.toObject(),
      applied: appliedCompanyIds.includes(company._id.toString()),
      applicationStatus: applications.find(
        (app) => app.company.toString() === company._id.toString(),
      )?.status,
    }));

    res.json(companiesWithStatus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Apply to company
// @route   POST /api/user/companies/apply/:companyId
// @access  Private/User
const applyToCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const existingApplication = await StudentCompany.findOne({
      user: req.user._id,
      company: company._id,
    });

    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "Already applied to this company" });
    }

    const application = await StudentCompany.create({
      user: req.user._id,
      company: company._id,
      status: "applied",
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get student's applications
// @route   GET /api/user/companies/applications
// @access  Private/User
const getStudentApplications = async (req, res) => {
  try {
    const applications = await StudentCompany.find({ user: req.user._id })
      .populate("company")
      .sort("-applicationDate");
    res.json(applications);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get student's interview schedule
// @route   GET /api/user/companies/interviews
// @access  Private/User
const getStudentInterviews = async (req, res) => {
  try {
    const interviews = await InterviewSchedule.find({
      students: req.user._id,
      status: { $in: ["scheduled", "ongoing"] },
    }).populate("company");

    res.json(interviews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Manager Controllers

// @desc    Create company
// @route   POST /api/manager/companies
// @access  Private/Manager
const createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all companies
// @route   GET /api/manager/companies
// @access  Private/Manager
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update company
// @route   PUT /api/manager/companies/:id
// @access  Private/Manager
const updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete company
// @route   DELETE /api/manager/companies/:id
// @access  Private/Manager
const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    await StudentCompany.deleteMany({ company: company._id });
    await InterviewSchedule.deleteMany({ company: company._id });
    await company.deleteOne();

    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all applications
// @route   GET /api/manager/companies/applications
// @access  Private/Manager
const getAllApplications = async (req, res) => {
  try {
    const applications = await StudentCompany.find()
      .populate("user", "name email studentId semester department")
      .populate("company")
      .sort("-applicationDate");
    res.json(applications);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update application status
// @route   PUT /api/manager/companies/applications/:id
// @access  Private/Manager
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, roundCleared, remarks, offerDetails } = req.body;

    const application = await StudentCompany.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = status || application.status;
    application.roundCleared = roundCleared || application.roundCleared;
    application.remarks = remarks || application.remarks;

    if (offerDetails) {
      application.offerLetter = {
        ...application.offerLetter,
        ...offerDetails,
      };
    }

    await application.save();

    res.json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getStudentCompanies,
  applyToCompany,
  getStudentApplications,
  getStudentInterviews,
  createCompany,
  getAllCompanies,
  updateCompany,
  deleteCompany,
  getAllApplications,
  updateApplicationStatus,
};
