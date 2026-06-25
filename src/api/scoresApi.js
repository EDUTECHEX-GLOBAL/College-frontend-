import axiosInstance from './axiosInstance';

export const extractGradeDocument = async ({ gradeLevel, file }) => {
  const data = new FormData();
  data.append('gradeLevel', String(gradeLevel));
  data.append('document', file);

  try {
    const response = await axiosInstance.post(
      '/api/application/scores/extract-grade-document',
      data,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180000 }
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Unable to process document';

    error.normalizedMessage = message;
    throw error;
  }
};

export const replaceGradeDocument = async ({ grade, gradeLevel, file }) => {
  const data = new FormData();
  data.append('grade', grade || `grade${gradeLevel}`);
  data.append('gradeLevel', String(gradeLevel || '').replace(/^grade/i, ''));
  data.append('documentType', 'marksheet');
  data.append('replace', 'true');
  data.append('document', file);

  const response = await axiosInstance.post('/api/students/documents/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000,
  });
  return response.data;
};

export const deleteGradeDocument = async (documentId) => {
  const response = await axiosInstance.delete(`/api/students/documents/${documentId}`);
  return response.data;
};

export const getGradeDocumentViewUrl = async (documentId) => {
  const response = await axiosInstance.get(`/api/students/documents/${documentId}/view-url`);
  return response.data;
};

export const getApplicationDocuments = async () => {
  const response = await axiosInstance.get('/api/application/documents');
  return response.data;
};
