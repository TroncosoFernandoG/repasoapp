import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { StudyTopicRepository } from '../repositories/studyTopicRepository';
import { StudyTopicService } from '../services/studyTopicService';
import { StudyTopicController } from '../controllers/studyTopicController';

const router = Router();
const topicRepository = new StudyTopicRepository();
const topicService = new StudyTopicService(topicRepository);
const topicController = new StudyTopicController(topicService);

router.use(authMiddleware);

router.get('/', topicController.list);
router.post('/', topicController.create);
router.put('/:id', topicController.update);
router.patch('/:id/status', topicController.updateStatus);
router.delete('/:id', topicController.remove);

export { router as topicRoutes };