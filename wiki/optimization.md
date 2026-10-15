# Optimization

> **In brief.** The energy gradient is a Monte Carlo estimate built from the same samples as the energy. Stochastic reconfiguration (SR) preconditions it with the quantum geometric tensor $S$, which turns the update into a step of imaginary-time evolution projected onto the variational manifold, equivalently a natural-gradient step. For networks with more parameters than samples the same update is computed exactly from an $N_s\times N_s$ kernel instead of the $N_p\times N_p$ matrix $S$ (minSR). Regularization is unavoidable because $S$ is singular, and the choice of regularizer, learning rate and sample size is part of the method.

Notation follows the [conventions page](../notation/). Centred quantities carry a bar: $\bar O_k=O_k-\langle O_k\rangle$, $\bar E_{\mathrm{loc}}=E_{\mathrm{loc}}-\langle E_{\mathrm{loc}}\rangle$.

Minimizing $E_\theta$ over the parameters of a neural quantum state is a stochastic optimization problem with three unusual features: the objective and its gradient are available only as noisy Monte Carlo estimates, the noise vanishes at the solution, and the parametrization is massively redundant, so the Euclidean geometry of $\theta$ bears no relation to the geometry of the states $|\Psi_\theta\rangle$. Stochastic reconfiguration addresses the third point; its kernel formulation makes it affordable for networks with $10^5$–$10^7$ parameters.

## Energy gradient

For real parameters,

$$
F_k\equiv\partial_{\theta_k}E_\theta=2\operatorname{Re}\left\langle \bar O_k^{*}\,\bar E_{\mathrm{loc}}\right\rangle .
$$

For complex parameters with $\log\Psi_\theta$ holomorphic in $\theta$ (the standard complex RBM, for example) the natural object is the Wirtinger derivative with respect to $\theta^*$,

$$
F_k\equiv\frac{\partial E_\theta}{\partial\theta_k^{*}}=\left\langle \bar O_k^{*}\,\bar E_{\mathrm{loc}}\right\rangle ,
$$

and steepest descent is $\theta\leftarrow\theta-\eta F$ without the factor 2. Mixed cases, real parameters feeding a complex output or separate amplitude and phase networks, reduce to the real formula with $O_k$ complex. The centring with $\langle E_{\mathrm{loc}}\rangle$ does not change the expectation value but removes the dominant noise term: at an eigenstate $\bar E_{\mathrm{loc}}=0$ configuration by configuration, so the gradient estimator inherits the zero-variance property of the energy.

Plain gradient descent on $F$ works for small networks and is what Adam-type optimizers do with adaptive scaling. It fails in two predictable ways: parameters that change the state only weakly (flat directions of the network) receive the same step as parameters that change it violently, and the step length in parameter space has no meaning in Hilbert space. Both are fixed by measuring distance between states rather than between parameter vectors.

## Stochastic reconfiguration

Stochastic reconfiguration (SR; Sorella, arXiv:cond-mat/9803107, arXiv:cond-mat/0009149) replaces the Euclidean metric with the metric induced on the variational manifold by the Hilbert-space inner product. For an infinitesimal change $\delta\theta$,

$$
1-\left|\frac{\langle\Psi_\theta|\Psi_{\theta+\delta\theta}\rangle}{\|\Psi_\theta\|\,\|\Psi_{\theta+\delta\theta}\|}\right|^2
=\sum_{kk'}\delta\theta_k^{*}\,S_{kk'}\,\delta\theta_{k'}+O(\delta\theta^3),
\qquad
S_{kk'}=\left\langle \bar O_k^{*}\,\bar O_{k'}\right\rangle .
$$

$S$ is the quantum geometric tensor restricted to the variational manifold; its real part is the Fubini–Study metric. The SR update is the natural-gradient step in this metric,

$$
\delta\theta=-\eta\,S^{-1}F ,
\qquad\text{or}\qquad
\delta\theta=-\eta\,\bigl[\operatorname{Re}S\bigr]^{-1}F
$$

for complex-holomorphic and real parametrizations respectively. The same update is obtained by projecting one step of imaginary-time evolution onto the manifold: minimizing the Fubini–Study distance between $|\Psi_{\theta+\delta\theta}\rangle$ and $(1-\tau H)|\Psi_\theta\rangle$ gives $S\,\delta\theta=-\tau F$, so $\eta$ is literally an imaginary-time step (Stokes et al., arXiv:1909.02108; Yuan et al., arXiv:1812.08767). Replacing $\tau$ by $i\,\mathrm{d}t$ gives the time-dependent variational principle used for real-time dynamics with the same $S$ and $F$ (Carleo and Troyer, arXiv:1606.02318; Schmitt and Heyl, arXiv:1912.08828).

SR is invariant under reparametrization of $\theta$, so rescaling a layer or changing the activation's normalization does not change the trajectory in state space. And the energy decreases to first order in $\eta$ for any positive semi-definite $S$, with the decrease $-\eta F^\dagger S^{-1}F$ bounded by the inverse metric rather than by the raw gradient norm.

Estimating $S$ and $F$ from the same $N_s$ samples is standard. $S$ is then a rank-$\le N_s$ matrix of size $N_p\times N_p$; building and inverting it costs $O(N_sN_p^2+N_p^3)$ in time and $O(N_p^2)$ in memory, which caps SR at a few $10^4$ parameters when done naively. Iterative solvers (conjugate gradient on $S\,\delta\theta=-\eta F$ using only matrix-vector products $\bar O^\dagger(\bar O v)$) remove the memory cost but still need many passes over the Jacobian per step.

## Natural gradient and information geometry

In the real case $\operatorname{Re}S$ is a Fisher information matrix in disguise. Write $\Psi_\theta=\sqrt{p_\theta}\,e^{i\phi_\theta}$ up to normalization. Then

$$
\operatorname{Re}S_{kk'}=\tfrac14\,\mathcal F_{kk'}+\operatorname{Cov}_{p_\theta}\!\left(\partial_k\phi_\theta,\partial_{k'}\phi_\theta\right),
\qquad
\mathcal F_{kk'}=\mathbb{E}_{p_\theta}\!\left[\partial_k\log p_\theta\,\partial_{k'}\log p_\theta\right].
$$

The first term is Amari's natural-gradient metric for the sampling distribution; the second is the phase contribution that has no classical counterpart. For a real positive ansatz SR *is* natural gradient descent on $p_\theta$ up to the factor $\tfrac14$; for a state with nontrivial phase structure the phase term is what prevents the optimizer from changing the sign structure too fast relative to the amplitudes. Park and Kastoryano (arXiv:1910.11163) analyse the resulting geometry for complex-parameter networks, including the degenerate directions that make regularization unavoidable.

## The kernel formulation (minSR)

Collect the centred log-derivatives into the $N_s\times N_p$ matrix $X_{ik}=\bar O_k(\boldsymbol{\sigma}_i)/\sqrt{N_s}$ and the centred local energies into $\varepsilon_i=\bar E_{\mathrm{loc}}(\boldsymbol{\sigma}_i)/\sqrt{N_s}$. Then the Monte Carlo estimates are simply

$$
S=X^\dagger X,\qquad F=X^\dagger\varepsilon ,
$$

and the SR step is the least-squares solution of the overdetermined (or, for $N_p>N_s$, underdetermined) linear system $X\,\delta\theta=-\eta\,\varepsilon$. The push-through identity

$$
\left(X^\dagger X+\lambda\,\mathbb 1_{N_p}\right)^{-1}X^\dagger
=X^\dagger\left(XX^\dagger+\lambda\,\mathbb 1_{N_s}\right)^{-1}
$$

moves the inversion from the $N_p\times N_p$ matrix $S$ to the $N_s\times N_s$ kernel $T=XX^\dagger$, whose entries are overlaps between samples, $T_{ij}=\tfrac1{N_s}\sum_k\bar O_k^*(\boldsymbol{\sigma}_i)\bar O_k(\boldsymbol{\sigma}_j)$, the empirical neural tangent kernel of the log-amplitude. The update becomes

$$
\delta\theta=-\eta\,X^\dagger\left(T+\lambda\,\mathbb 1\right)^{-1}\varepsilon ,
$$

at a cost of $O(N_pN_s^2+N_s^3)$ and memory $O(N_sN_p)$ for the Jacobian, which is what a reverse-mode pass stores anyway. Chen and Heyl (arXiv:2302.01941) derived this as the minimum-norm solution of the least-squares problem and used it to optimize deep networks with far more parameters than samples; Rende et al. (arXiv:2310.05715) pointed out the identity above and the fact that no approximation is involved: for $\lambda\to0$ the kernel update coincides with SR using the pseudo-inverse of $S$. For real parameters and complex $\Psi$, stack real and imaginary parts, $\tilde X=\begin{pmatrix}\operatorname{Re}X\\ \operatorname{Im}X\end{pmatrix}$, $\tilde\varepsilon=\begin{pmatrix}\operatorname{Re}\varepsilon\\ \operatorname{Im}\varepsilon\end{pmatrix}$, and invert the real $2N_s\times 2N_s$ kernel $\tilde X\tilde X^{\top}$.

The kernel picture also clarifies what SR can and cannot do with finite samples. $S$ estimated from $N_s$ samples has rank at most $N_s$, so with $N_p>N_s$ the update lives in the $N_s$-dimensional span of the sampled log-derivative vectors; directions of parameter space invisible to the current batch are not moved. This is a feature (no spurious updates from unsampled directions) and the reason why increasing $N_s$ keeps improving minSR optimizations well beyond the point where the gradient itself is converged.

## Regularization

$S$ is singular whenever parameters are redundant, which for a neural network is always: the normalization of $\Psi$ is a flat direction, and so are the gauge freedoms of each layer. Finite sampling adds noise to the small eigenvalues that $S^{-1}$ then amplifies. The standard remedies are:

- **Diagonal shift**, $S\to S+\lambda\,\mathbb 1$ with $\lambda\sim10^{-4}$–$10^{-2}$. Equivalent to adding $\lambda\|\delta\theta\|^2$ to the Fubini–Study distance, i.e. a trust region in parameter space. Breaks the reparametrization invariance of SR by the amount $\lambda$.
- **Scale-invariant (relative) shift**, $S_{kk}\to S_{kk}(1+\lambda)$ (Sorella, Casula, Rocca, arXiv:cond-mat/0702349, Eq. 11). Regularizes each direction relative to its own curvature, so parameters with tiny natural scale are not frozen by a uniform shift. The same idea applied to the kernel is $T\to T+\lambda\operatorname{diag}(T)$.
- **Spectral cut-off**: diagonalize $S$ (or $T$) and discard eigen-directions with eigenvalue below a threshold relative to the largest. Equivalent to the pseudo-inverse with a tolerance; the threshold sets how many effective directions are updated per step.
- **Signal-to-noise filtering** (Schmitt and Heyl, arXiv:1912.08828): in the eigenbasis of $S$, estimate the Monte Carlo error of each component of $F$ and zero the components whose signal-to-noise ratio is below a cut. Unlike a fixed cut-off this adapts to the actual noise level and is the method of choice for real-time evolution, where unfiltered noise is integrated instead of damped.

Regularization strength, learning rate and sample size are coupled: a larger $\lambda$ permits a larger $\eta$, and a larger $N_s$ permits a smaller $\lambda$. Published protocols usually quote all three plus a schedule.

## Practical protocol

1. Choose $N_s$ by the gradient noise, not by $N_p$. With the kernel formulation $N_s\ll N_p$ is routine; $10^3$–$10^4$ samples per step is typical for lattice models, with a few Metropolis sweeps between stored samples so that successive samples are weakly correlated.
2. Use a learning-rate schedule. SR with constant $\eta\sim10^{-2}$–$10^{-1}$ reaches the basin quickly; the last decades of energy are gained with $\eta$ decreased by one to two orders of magnitude, often together with a decrease of $\lambda$ and an increase of $N_s$.
3. Impose symmetries after the fact when possible. Projecting the state onto an irreducible representation of the lattice symmetry group (translations, point group, spin flip) lowers the energy at a cost linear in the group size and changes the local energy, not the optimizer.
4. Monitor the variance as well as the energy. A decreasing energy with a stagnating or rising variance signals that the optimizer is trading sign-structure quality for amplitude quality, a common precursor to a plateau on frustrated models (Bukov, Schmitt, Dupont, arXiv:2011.11214).
5. Evaluate the final state separately. Freeze $\theta$, run long chains, and apply the [binning analysis](../variational-monte-carlo/) to obtain the error bar. The energy reported in a paper, and in Ketboard, is this number, not the last value of the optimization trace.

## Alternatives and extensions

- **Linear method** (Toulouse and Umrigar, arXiv:physics/0701039): diagonalize $H$ in the basis $\{|\Psi_\theta\rangle,\partial_k|\Psi_\theta\rangle\}$ each step. Quadratic convergence near the minimum and no step-size tuning, at the price of a generalized eigenproblem of size $N_p+1$; used for Jastrow–Slater and small networks, impractical beyond $10^4$ parameters.
- **Lanczos steps**: apply $(1+\alpha_1 H+\dots)$ to the optimized state and optimize the few $\alpha_p$. Each step is a legitimate variational state whose energy can be evaluated directly, so it is eligible for Ketboard; the subsequent zero-variance extrapolation is not (Hu et al., arXiv:1304.2630; Nomura and Imada, arXiv:2005.14142).
- **First-order optimizers with preconditioning** (Adam, RMSProp): no $S$ at all, cheap per step, competitive in early optimization and for autoregressive models where exact sampling makes gradients clean. Converge slowly in the final phase on frustrated models, where the metric matters most.
- **Supervised and projected schemes**: fit the network to $H|\Psi\rangle$ or to a power-method target instead of minimizing the energy; the final state is still variational and its directly evaluated energy qualifies, provided the number reported is $\langle\Psi_\theta|H|\Psi_\theta\rangle/\langle\Psi_\theta|\Psi_\theta\rangle$ and not a projected estimate.

## References

- S. Sorella, *Green function Monte Carlo with stochastic reconfiguration*, arXiv:cond-mat/9803107 (1998). The SR update.
- S. Sorella, *Generalized Lanczos algorithm for variational quantum Monte Carlo*, arXiv:cond-mat/0009149 (2000). SR as imaginary-time projection; Lanczos steps on a variational state.
- S. Sorella, M. Casula, D. Rocca, *Weak binding between two aromatic rings: Feeling the van der Waals attraction by quantum Monte Carlo methods*, arXiv:cond-mat/0702349 (2007). Scale-invariant regularization of SR.
- S. Amari, *Natural gradient works efficiently in learning*, Neural Computation 10, 251 (1998). The natural gradient.
- J. Stokes, J. Izaac, N. Killoran, G. Carleo, *Quantum natural gradient*, arXiv:1909.02108 (2019). The Fubini–Study metric as the natural metric for variational states.
- X. Yuan, S. Endo, Q. Zhao, Y. Li, S. Benjamin, *Theory of variational quantum simulation*, arXiv:1812.08767 (2018). Variational principles for imaginary- and real-time evolution.
- C.-Y. Park, M. J. Kastoryano, *Geometry of learning neural quantum states*, arXiv:1910.11163 (2019). The geometry of $S$ for complex-parameter networks.
- A. Chen, M. Heyl, *Empowering deep neural quantum states through efficient optimization*, arXiv:2302.01941 (2023). minSR.
- R. Rende, L. L. Viteritti, L. Bardone, F. Becca, S. Goldt, *A simple linear algebra identity to optimize large-scale neural network quantum states*, arXiv:2310.05715 (2023). The kernel identity and its real-parameter form.
- M. Schmitt, M. Heyl, *Quantum many-body dynamics in two dimensions with artificial neural networks*, arXiv:1912.08828 (2019). Signal-to-noise regularization.
- J. Toulouse, C. J. Umrigar, *Optimization of quantum Monte Carlo wave functions by energy minimization*, arXiv:physics/0701039 (2007). The linear method.
- M. Bukov, M. Schmitt, M. Dupont, *Learning the ground state of a non-stoquastic quantum Hamiltonian in a rugged neural network landscape*, arXiv:2011.11214 (2020). Optimization landscapes with sign structure.
- F. Vicentini et al., *NetKet 3: Machine learning toolbox for many-body quantum systems*, arXiv:2112.10526 (2021). Reference implementations.
