const path = require('path');
const authHelper = require(path.resolve(__dirname, './auth-helper.test.cjs'));
const request = require('supertest');

let baseUrl;
let authenticatedAgent;
let testUserId;
let testLabId = null;
let testCircleId = null;

// Find a working base URL for the API
beforeAll(async () => {
  // Try to use environment variable if set, otherwise default to localhost
  baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  
  try {
    const authResponse = await authHelper.authenticate(baseUrl);
    authenticatedAgent = authResponse.agent;
    testUserId = authResponse.userId;
    
    console.log(`Authenticated with user ID: ${testUserId}`);
  } catch (error) {
    console.error('Authentication error:', error.message);
    throw error;
  }
});

  // Test creating a new lab
  describe('Lab Creation', () => {
    it('Can create a new lab', async () => {
      const labData = {
        name: 'Test Lab',
        description: 'A test lab for API testing',
        experimentType: 'a_b_test',
        goals: 'Test the lab creation API',
        successMetrics: {
          metrics: [
            {
              name: 'Engagement',
              target: 80,
              priority: 'high'
            }
          ]
        }
      };

      const response = await request(baseUrl)
        .post('/api/labs')
        .set('Cookie', authCookie)
        .send(labData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(labData.name);
      expect(response.body.experimentType).toBe(labData.experimentType);
      expect(response.body.status).toBe('draft'); // Default status

      // Save the lab ID for later tests
      testLabId = response.body.id;
      console.log(`Created test lab with ID: ${testLabId}`);
    });

    it('Cannot create a lab without required fields', async () => {
      const response = await request(baseUrl)
        .post('/api/labs')
        .set('Cookie', authCookie)
        .send({
          // Missing name and experimentType
          description: 'An invalid lab that should fail'
        });

      expect([400, 422]).toContain(response.status);
      // Expect some kind of validation error message
      expect(response.body).toHaveProperty('message');
    });
  });

  // Test getting labs
  describe('Lab Retrieval', () => {
    it('Can get all labs', async () => {
      const response = await request(baseUrl)
        .get('/api/labs')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Should have at least the one we created
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('Can get a specific lab by ID', async () => {
      if (!testLabId) {
        throw new Error('Test lab ID not available. Lab creation test may have failed.');
      }

      const response = await request(baseUrl)
        .get(`/api/labs/${testLabId}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testLabId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('experimentType');
    });

    it('Returns 404 for non-existent lab', async () => {
      const response = await request(baseUrl)
        .get('/api/labs/99999') // Assuming this ID does not exist
        .set('Cookie', authCookie);

      expect(response.status).toBe(404);
    });
  });

  // Test updating a lab
  describe('Lab Updates', () => {
    it('Can update a lab', async () => {
      if (!testLabId) {
        throw new Error('Test lab ID not available. Lab creation test may have failed.');
      }

      const updateData = {
        name: 'Updated Test Lab',
        description: 'An updated test lab description',
        goals: 'Updated goals for testing'
      };

      const response = await request(baseUrl)
        .patch(`/api/labs/${testLabId}`)
        .set('Cookie', authCookie)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testLabId);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.goals).toBe(updateData.goals);
    });

    it('Can update lab status', async () => {
      if (!testLabId) {
        throw new Error('Test lab ID not available. Lab creation test may have failed.');
      }

      const statusUpdate = {
        status: 'active'
      };

      const response = await request(baseUrl)
        .patch(`/api/labs/${testLabId}/status`)
        .set('Cookie', authCookie)
        .send(statusUpdate);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testLabId);
      expect(response.body.status).toBe(statusUpdate.status);
      expect(response.body).toHaveProperty('launchedAt'); // Should set the launch date
    });

    it('Validates lab status updates', async () => {
      if (!testLabId) {
        throw new Error('Test lab ID not available. Lab creation test may have failed.');
      }

      const statusUpdate = {
        status: 'invalid_status' // Invalid status
      };

      const response = await request(baseUrl)
        .patch(`/api/labs/${testLabId}/status`)
        .set('Cookie', authCookie)
        .send(statusUpdate);

      expect([400, 422]).toContain(response.status);
      expect(response.body).toHaveProperty('message');
    });
  });

  // Test lab circles
  describe('Lab Circles', () => {
    // Create a test circle to use with lab
    before(async () => {
      // Skip circle creation if we already have one
      if (testCircleId) return;

      const circleData = {
        name: 'Test Lab Circle',
        description: 'A circle for testing lab functionality',
        visibility: 'public'
      };

      const response = await request(baseUrl)
        .post('/api/circles')
        .set('Cookie', authCookie)
        .send(circleData);

      if (response.status === 201 && response.body && response.body.id) {
        testCircleId = response.body.id;
        console.log(`Created test circle with ID: ${testCircleId}`);
      } else {
        console.warn('Failed to create test circle. Circle tests may fail.');
      }
    });

    it('Can add a circle to a lab', async () => {
      if (!testLabId || !testCircleId) {
        throw new Error('Test lab ID or circle ID not available. Previous tests may have failed.');
      }

      const circleData = {
        circleId: testCircleId,
        role: 'treatment'
      };

      const response = await request(baseUrl)
        .post(`/api/labs/${testLabId}/circles`)
        .set('Cookie', authCookie)
        .send(circleData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('labId', testLabId);
      expect(response.body).toHaveProperty('circleId', testCircleId);
      expect(response.body).toHaveProperty('role', circleData.role);
    });

    it('Can get circles for a lab', async () => {
      if (!testLabId) {
        throw new Error('Test lab ID not available. Lab creation test may have failed.');
      }

      const response = await request(baseUrl)
        .get(`/api/labs/${testLabId}/circles`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Should have at least the one we added
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      
      // Verify the circle details
      const circleFound = response.body.some(c => c.circle && c.circle.id === testCircleId);
      expect(circleFound).toBe(true);
    });

    it('Can get circle stats for a lab', async () => {
      if (!testLabId) {
        throw new Error('Test lab ID not available. Lab creation test may have failed.');
      }

      const response = await request(baseUrl)
        .get(`/api/labs/${testLabId}/circles/stats`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(typeof response.body).toBe('object');
      expect(response.body).toHaveProperty('circles');
      expect(Array.isArray(response.body.circles)).toBe(true);
    });

    it('Can update a circle role in a lab', async () => {
      if (!testLabId || !testCircleId) {
        throw new Error('Test lab ID or circle ID not available. Previous tests may have failed.');
      }

      const updateData = {
        role: 'control'
      };

      const response = await request(baseUrl)
        .patch(`/api/labs/${testLabId}/circles/${testCircleId}`)
        .set('Cookie', authCookie)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('labId', testLabId);
      expect(response.body).toHaveProperty('circleId', testCircleId);
      expect(response.body).toHaveProperty('role', updateData.role);
    });
  });

  // Test lab duplication
  describe('Lab Duplication', () => {
    it('Can duplicate a lab', async () => {
      if (!testLabId) {
        throw new Error('Test lab ID not available. Lab creation test may have failed.');
      }

      const response = await request(baseUrl)
        .post(`/api/labs/${testLabId}/duplicate`)
        .set('Cookie', authCookie);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id');
      expect(response.body.id).to.not.equal(testLabId); // Should be a new ID
      expect(response.body.name).to.include('Copy'); // Name should indicate it's a copy
    });
  });

  // Test lab posts
  describe('Lab Posts', () => {
    it('Can get posts for a lab', async () => {
      if (!testLabId) {
        throw new Error('Test lab ID not available. Lab creation test may have failed.');
      }

      const response = await request(baseUrl)
        .get(`/api/labs/${testLabId}/posts`)
        .set('Cookie', authCookie);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      // May be empty if no posts exist yet
    });
  });

  // Test lab deletion (do this last)
  describe('Lab Deletion', () => {
    it('Can remove a circle from a lab', async () => {
      if (!testLabId || !testCircleId) {
        throw new Error('Test lab ID or circle ID not available. Previous tests may have failed.');
      }

      const response = await request(baseUrl)
        .delete(`/api/labs/${testLabId}/circles/${testCircleId}`)
        .set('Cookie', authCookie);

      expect(response.status).to.equal(200);
      // Should return success message or deleted record
      if (response.body.message) {
        expect(response.body.message).to.include('success');
      } else {
        expect(response.body).to.have.property('circleId', testCircleId);
      }
    });

    it('Can delete a lab', async () => {
      if (!testLabId) {
        throw new Error('Test lab ID not available. Lab creation test may have failed.');
      }

      const response = await request(baseUrl)
        .delete(`/api/labs/${testLabId}`)
        .set('Cookie', authCookie);

      expect(response.status).to.equal(200);
      // Should return success message or deleted record
      if (response.body.message) {
        expect(response.body.message).to.include('success');
      } else {
        expect(response.body).to.have.property('id', testLabId);
      }
    });

    it('Cannot access a deleted lab', async () => {
      if (!testLabId) {
        throw new Error('Test lab ID not available. Lab creation test may have failed.');
      }

      const response = await request(baseUrl)
        .get(`/api/labs/${testLabId}`)
        .set('Cookie', authCookie);

      expect(response.status).to.equal(404);
    });
  });
});