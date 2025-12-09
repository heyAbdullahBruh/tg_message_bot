import express from 'express';
import { handleContactForm } from '../controllers/contact.controller.js';
import { validateContact } from '../middleware/validation.js';

const router = express.Router();

router.post('/contact', validateContact, handleContactForm);

export default router;
